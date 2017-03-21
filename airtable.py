import requests, json
import pandas as pd


class AT:
	def __init__(self, base, api):
		self.base = base
		self.api = api
		self.headers = {"Authorization": "Bearer "+self.api}

	def getTable(self,table):
		r = requests.get("https://api.airtable.com/v0/"+self.base+"/"+table, headers=self.headers)
		j = r.json()
		df = pd.DataFrame(dict(zip([i["id"] for i in j["records"]], [i["fields"] for i in j["records"]]))).transpose()
		return df

	def pushToTable(self, table, obj, typecast=False):
		h = self.headers
		h["Content-type"] =  "application/json"
		r = requests.post("https://api.airtable.com/v0/"+self.base+"/"+table, headers=h, data=json.dumps({"fields": obj, "typecast": typecast}))
		if r.status_code == requests.codes.ok:
			return r.json()
		else:
			print(r.json)
			return False