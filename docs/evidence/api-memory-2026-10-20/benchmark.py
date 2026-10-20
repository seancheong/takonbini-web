"""Plan or run a bounded, isolated Lambda memory comparison.

The default is read-only. --execute creates one temporary function using the
released artifact/role/environment, makes 18 GET reads, then removes it and its
own log group. It never updates the source function, alias or API Gateway.
"""
import argparse
import base64
import hashlib
import json
import re
import subprocess
import time
import tempfile
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

ORDER = (256, 512, 1024, 1024, 512, 256, 512, 256, 1024)


def aws(operation, arguments, profile, region):
    with tempfile.TemporaryDirectory(prefix="takonbini-aws-input-") as directory:
        input_path = Path(directory) / "request.json"
        input_path.write_text(json.dumps(arguments["input"]))
        input_path.chmod(0o600)
        command = ["aws", *operation.split(), "--profile", profile, "--region", region,
                   "--output", "json", "--cli-binary-format", "base64"]
        if operation == "lambda invoke":
            # Invoke is an AWS CLI customization without --cli-input-json.
            payload_path = Path(directory) / "payload.json"
            payload_path.write_bytes(base64.b64decode(arguments["input"]["Payload"]))
            payload_path.chmod(0o600)
            request = arguments["input"]
            command += ["--function-name", request["FunctionName"],
                        "--invocation-type", request["InvocationType"],
                        "--payload", "fileb://" + str(payload_path)]
            if "LogType" in request:
                command += ["--log-type", request["LogType"]]
        else:
            command += ["--cli-input-json", "file://" + str(input_path)]
        command += arguments.get("cli", [])
        result = subprocess.run(command, capture_output=True, text=True, timeout=90)
    if result.returncode:
        match = re.search(r"An error occurred \(([^)]+)\)", result.stderr)
        raise RuntimeError(f"{operation} failed: {match.group(1) if match else 'CLI/credential failure'}")
    return json.loads(result.stdout) if result.stdout.strip() else {}


def make_plan(source):
    config = source["Configuration"]
    if config.get("PackageType") != "Zip" or config.get("Runtime") != "nodejs22.x":
        raise ValueError("Expected the reviewed Node 22 ZIP API")
    if config.get("Architectures") != ["arm64"] or config.get("VpcConfig", {}).get("VpcId"):
        raise ValueError("Expected the reviewed non-VPC arm64 API")
    if config.get("MemorySize") != 256 or config.get("Timeout") != 10:
        raise ValueError("Source configuration changed; review before benchmarking")
    env = config.get("Environment", {}).get("Variables", {})
    if not env.get("API_SECRET_KEY") or not env.get("MONGODB_PARAMETER_NAME"):
        raise ValueError("Expected existing API authentication and secure Mongo parameter pointer")
    return {
        "mode": "isolated memory comparison; source function unchanged",
        "region": "ap-northeast-1", "runtime": config["Runtime"],
        "architecture": "arm64", "memoryOrderMiB": list(ORDER),
        "coldAttempts": 9, "immediateRepeats": 9, "totalInvocations": 18,
        "timeoutSeconds": 10, "reservedConcurrency": 1,
        "reuseReleasedArtifact": True, "reuseExistingRoleAndEnvironment": True,
        "publicEndpoint": False, "schedules": False, "provisionedConcurrency": False,
        "sourceFunctionUpdates": False, "newIamRolesOrPolicies": False,
        "dataOperations": "GET /products?limit=20&status=allWithoutSoon only",
        "cleanup": "delete only this run's temporary function and log group",
        "limits": "Billed GB-seconds will be recorded, not treated as actual account billing. Backend state remains shared/uncontrolled.",
    }


def owned(name, nonce, config):
    if name == config["FunctionName"] or not name.startswith("takonbini-perf-") or not name.endswith(nonce):
        raise ValueError("Temporary target must be distinct from source and owned by this run")
    return name


def parse_report(tail):
    line = next((line for line in tail.splitlines() if line.startswith("REPORT RequestId:")), None)
    if line is None:
        raise ValueError("Missing Lambda REPORT; no timing result can be claimed")
    report = {}
    for key in ("Duration", "Billed Duration", "Memory Size", "Max Memory Used", "Init Duration"):
        match = re.search(r"(?:^|\t)" + key + r": ([0-9.]+)", line)
        if match:
            report[key] = float(match.group(1))
    return report


def run(args):
    if args.region != "ap-northeast-1":
        raise ValueError("This reviewed benchmark is limited to Tokyo")
    call = lambda operation, payload, cli=None: aws(operation, {"input": payload, "cli": cli or []}, args.profile, args.region)
    source = call("lambda get-function", {"FunctionName": args.source_function})
    plan = make_plan(source)
    print(json.dumps(plan, indent=2), flush=True)
    if not args.execute:
        return
    config = source["Configuration"]
    nonce = uuid.uuid4().hex[:12]
    name = owned("takonbini-perf-" + nonce, nonce, config)
    description = "Takonbini bounded memory diagnostic " + nonce
    group = "/aws/lambda/" + name
    with urllib.request.urlopen(source["Code"]["Location"], timeout=30) as response:
        archive = response.read(32 * 1024 * 1024 + 1)
    if len(archive) > 32 * 1024 * 1024:
        raise ValueError("Unexpected artifact size")
    digest = base64.b64encode(hashlib.sha256(archive).digest()).decode()
    if digest != config["CodeSha256"]:
        raise ValueError("Released artifact digest mismatch")
    environment = config["Environment"]["Variables"]
    created = False
    samples = []
    result = {"plan": plan, "startedUtc": datetime.now(timezone.utc).isoformat(), "samples": samples, "temporaryFunction": name, "cleanup": {}}
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    expected_digest = None
    try:
        payload = {"FunctionName": name, "Runtime": config["Runtime"], "Architectures": ["arm64"],
                   "Role": config["Role"], "Handler": config["Handler"],
                   "Code": {"ZipFile": base64.b64encode(archive).decode()},
                   "Timeout": 10, "MemorySize": 256, "Description": description,
                   "Environment": {"Variables": environment},
                   "Tags": {"Project": "takonbini", "Purpose": "performance-diagnostic", "Run": nonce}}
        created = True
        call("lambda create-function", payload)
        call("lambda wait function-active-v2", {"FunctionName": name})
        call("lambda put-function-concurrency", {"FunctionName": name, "ReservedConcurrentExecutions": 1})
        for round_number, memory in enumerate(ORDER, 1):
            # A unique environment value invalidates the previous configuration even
            # when consecutive trials use the same memory. Only the scratch target changes.
            env = {**environment, "TAKONBINI_PERF_ROUND": str(round_number)}
            call("lambda update-function-configuration", {"FunctionName": owned(name, nonce, config),
                 "MemorySize": memory, "Environment": {"Variables": env}})
            call("lambda wait function-updated-v2", {"FunctionName": name})
            event = {"version": "2.0", "routeKey": "ANY /{proxy+}", "rawPath": "/products",
                     "rawQueryString": "limit=20&status=allWithoutSoon",
                     "headers": {"x-api-key": environment["API_SECRET_KEY"]},
                     "requestContext": {"http": {"method": "GET", "path": "/products", "protocol": "HTTP/1.1",
                     "sourceIp": "127.0.0.1", "userAgent": "bounded-memory-diagnostic"},
                     "requestId": "diagnostic", "stage": "$default"}, "isBase64Encoded": False}
            for repeat in (False, True):
                # Credentials use a private temporary input file, never command-line values or retained artifacts.
                start = time.perf_counter()
                with tempfile.TemporaryDirectory(prefix="takonbini-invoke-") as directory:
                    payload_path = Path(directory) / "response.json"
                    response = call("lambda invoke", {"FunctionName": owned(name, nonce, config),
                                    "InvocationType": "RequestResponse", "LogType": "Tail",
                                    "Payload": base64.b64encode(json.dumps(event).encode()).decode()},
                                    [str(payload_path)])
                    if response.get("FunctionError") or response.get("StatusCode") != 200:
                        raise ValueError("Diagnostic invocation failed; response content is not logged")
                    api_response = json.loads(payload_path.read_text())
                if api_response.get("statusCode") != 200 or api_response.get("isBase64Encoded"):
                    raise ValueError("Expected a successful plain JSON API response")
                page = json.loads(api_response["body"])
                if not isinstance(page.get("products"), list) or not 1 <= len(page["products"]) <= 20:
                    raise ValueError("Unexpected catalog shape/count")
                body_digest = hashlib.sha256(json.dumps(page, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
                expected_digest = expected_digest or body_digest
                report = parse_report(base64.b64decode(response["LogResult"]).decode())
                row = {"round": round_number, "memoryMiB": memory, "immediateRepeat": repeat,
                       "observedCold": "Init Duration" in report, "report": report,
                       "clientWithCliMs": (time.perf_counter() - start) * 1000,
                       "status": 200, "productCount": len(page["products"]),
                       "sameBody": body_digest == expected_digest,
                       "billedGbSeconds": report["Billed Duration"] / 1000 * memory / 1024}
                samples.append(row)
                output.write_text(json.dumps(result, indent=2))
                print(json.dumps(row), flush=True)
                if not row["sameBody"]:
                    raise ValueError("Catalog changed across trials; comparison stopped")
                if report.get("Memory Size") != memory:
                    raise ValueError("Effective memory does not match trial")
                if not repeat and not row["observedCold"]:
                    raise ValueError("Cold trial did not report Init Duration; no cold claim")
    finally:
        try:
            if created:
                try:
                    actual = call("lambda get-function-configuration", {"FunctionName": name})
                except RuntimeError as error:
                    if "ResourceNotFoundException" not in str(error):
                        raise
                    actual = None
                    result["cleanup"]["functionNotCreated"] = True
                if actual is not None:
                    if actual.get("Description") != description:
                        raise RuntimeError("Scratch ownership changed; refused automatic deletion")
                    call("lambda delete-function", {"FunctionName": name})
                    result["cleanup"]["functionDeleted"] = True
                    try:
                        call("logs delete-log-group", {"logGroupName": group})
                        result["cleanup"]["logGroupDeleted"] = True
                    except RuntimeError as error:
                        if "ResourceNotFoundException" not in str(error):
                            raise
                        result["cleanup"]["logGroupNotCreated"] = True
        except Exception as error:
            result["cleanup"]["error"] = str(error)
            raise
        finally:
            output.write_text(json.dumps(result, indent=2))



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-function", required=True)
    parser.add_argument("--profile", default="default")
    parser.add_argument("--region", default="ap-northeast-1")
    parser.add_argument("--output", default="/private/tmp/takonbini-api-memory.json")
    parser.add_argument("--execute", action="store_true")
    run(parser.parse_args())
