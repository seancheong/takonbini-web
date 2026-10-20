import argparse,base64,contextlib,copy,hashlib,importlib.util,io,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('benchmark',str(Path(__file__).with_name('benchmark.py')));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
ZIP=b'fixture-release-archive'
SOURCE={'Configuration':{'FunctionName':'source-api','PackageType':'Zip','Runtime':'nodejs22.x','Architectures':['arm64'],'MemorySize':256,'Timeout':10,'Role':'existing-role','Handler':'index.handler','Environment':{'Variables':{'API_SECRET_KEY':'fixture-only-key','MONGODB_PARAMETER_NAME':'fixture-pointer'}},'CodeSha256':base64.b64encode(hashlib.sha256(ZIP).digest()).decode()},'Code':{'Location':'https://fixture.example.test/artifact'}}
class BenchmarkTests(unittest.TestCase):
 def test_target_guard_rejects_source_and_unowned_names(self):
  for name in ['source-api','other-abcdef','takonbini-perf-wrong']:
   with self.assertRaises(ValueError):m.owned(name,'abcdef',SOURCE['Configuration'])
 def test_configuration_drift_requires_review(self):
  s=copy.deepcopy(SOURCE);s['Configuration']['MemorySize']=512
  with self.assertRaises(ValueError):m.make_plan(s)
 def test_plan_is_read_only(self):
  calls=[]
  def aws(op,args,*unused):calls.append(op);return copy.deepcopy(SOURCE)
  with patch.object(m,'aws',aws),contextlib.redirect_stdout(io.StringIO()):m.run(argparse.Namespace(source_function='source-api',profile='default',region='ap-northeast-1',execute=False))
  self.assertEqual(calls,['lambda get-function'])
 def exercise(self,fail=False):
  calls=[];state={};invocations=0
  def aws(op,args,*unused):
   nonlocal invocations
   p=args['input'];calls.append((op,copy.deepcopy(p)))
   if op=='lambda get-function':return copy.deepcopy(SOURCE)
   if op=='lambda create-function':state.update(p);return {}
   if op=='lambda update-function-configuration':state.update(p);return {}
   if op=='lambda get-function-configuration':return state
   if op=='lambda invoke':
    invocations+=1
    if fail and invocations==2:raise RuntimeError('fixture invocation failure')
    event=json.loads(base64.b64decode(p['Payload']));self.assertEqual(event['requestContext']['http']['method'],'GET');self.assertEqual(event['rawPath'],'/products');self.assertEqual(event['rawQueryString'],'limit=20&status=allWithoutSoon')
    Path(args['cli'][-1]).write_text(json.dumps({'statusCode':200,'body':json.dumps({'products':[{'id':'fixture'}]})}))
    tail='REPORT RequestId: fixture\tDuration: 10.0 ms\tBilled Duration: 20 ms\tMemory Size: '+str(state['MemorySize'])+' MB\tMax Memory Used: 100 MB'+ ('\tInit Duration: 10 ms' if invocations%2 else '')
    return {'StatusCode':200,'LogResult':base64.b64encode(tail.encode()).decode()}
   return {}
  with tempfile.TemporaryDirectory() as d:
   output=Path(d)/'result.json';args=argparse.Namespace(source_function='source-api',profile='default',region='ap-northeast-1',execute=True,output=str(output))
   with patch.object(m,'aws',aws),patch.object(m.urllib.request,'urlopen',lambda *a,**k:io.BytesIO(ZIP)),contextlib.redirect_stdout(io.StringIO()):
    if fail:
     with self.assertRaisesRegex(RuntimeError,'fixture invocation failure'):m.run(args)
    else:m.run(args)
   result=json.loads(output.read_text());self.assertTrue(result['cleanup']['functionDeleted']);self.assertTrue(result['cleanup']['logGroupDeleted'])
   self.assertNotIn('fixture-only-key',output.read_text())
   for op,p in calls:
    if op not in ['lambda get-function','logs delete-log-group']:
     self.assertTrue(p['FunctionName'].startswith('takonbini-perf-'));self.assertNotEqual(p['FunctionName'],'source-api')
   if not fail:self.assertEqual(len(result['samples']),18);self.assertEqual(sum(r['observedCold'] for r in result['samples']),9)
   self.assertEqual(SOURCE['Configuration']['Environment']['Variables'],{'API_SECRET_KEY':'fixture-only-key','MONGODB_PARAMETER_NAME':'fixture-pointer'})
 def test_bounded_execution_and_cleanup(self):self.exercise()
 def test_failure_stops_and_cleans_up(self):self.exercise(True)
if __name__=='__main__':unittest.main()
