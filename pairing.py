# Computes a pairing, i.e. a way to match a group of N people in N pairs,
# where each person belongs to two pairs: one as a teacher and one as a learner
#
# Example:
# Alice     teaches Ruby        to Bob
# Bob       teaches Python      to Carol
# Carol     teaches Javascript  to Alice
#
# To solve this problem we build a graph with:
# - a "Teacher" node and another "Learner" node for each person
# - an edge between a "Teacher" and a "Learner" whenever there is a skill that
#   the Teacher can teach and the Learner wants to learn
#
# Once this is done, building a pairing is equivalent to finding a
# "maximal matching" in the graph, which is a well-known problem in graph theory
# see https://en.wikipedia.org/wiki/Matching_(graph_theory)


import sys, csv
import networkx as nx
import matplotlib.pyplot as plt
import time
import json
import pandas as pd
from airtable.airtable import Airtable

# Parsing the input CSV file exported from Google Spreadsheets
# TODO: this part is tied to the current structure of the spreadsheet,
# which is not great and should be changed.
# A much more robust, easier to parse structure would be:
#   person,learns_or_teaches,skill
#   Alice,learns,Javascript
#   Bob,teaches,Python



with open('settings.json') as settings_file:
    settings = json.load(settings_file)

at = Airtable(settings["airtable_base_key"],settings["airtable_api_key"])
table = at.get("P2PL Tests")


# if len(sys.argv) < 2:
#     print("Usage: python pairing.py path/to/file.csv")
#     exit(1)
# with open(sys.argv[1]) as csvfile:
#     rows = list(csv.reader(csvfile))



# skills = None
# interests = None

# ppl = set()
# masters_by_skill = {}
# learners_by_skill = {}
# skills_by_master = {}
# skills_by_learner = {}

# # given a dictionary d, initializes d[k] to an empty list and appends v to it
# def append_to_list_at_key(d, k, v):
#     if d.get(k) is None:
#         d[k] = []
#     d[k].append(v)
#     return d

# removes prefix from string
def remove_prefix(text, prefix):
    return text[text.startswith(prefix) and len(prefix):]

# i = 0
# for row in rows:
#     if i == 0:
#         # row 0 gives what people want to learn
#         interests = row
#     elif i == 13:
#         # row 13 gives what people can teach
#         # TODO: this will break when the spreadsheet changes...
#         skills = row
#     else:
#         j = 0
#         for person in row:
#             if isinstance(person, str) and len(person) > 0:
#                 person = remove_prefix(person, "@").lower()
#                 ppl.add(person)
#                 if skills is not None:
#                     append_to_list_at_key(masters_by_skill, skills[j], person)
#                     append_to_list_at_key(skills_by_master, person, skills[j])
#                 elif interests is not None:
#                     append_to_list_at_key(learners_by_skill, interests[j], person)
#                     append_to_list_at_key(skills_by_learner, person, interests[j])
#             j += 1
#     i += 1


# Some logs for debugging/inspecting
# print("MASTERS", masters_by_skill)
# print("LEARNERS", learners_by_skill)
# print("BY LEARNER:", skills_by_learner)
# print("BY MASTER:", skills_by_master)


# Building the graph

## Get a dataframe of records for interests and skills
records = pd.DataFrame([table["records"][j]["fields"] for j in range(len(table["records"]))]).set_index("Slack Handle")
records = records[["Interests", "Skills"]]

## Get dataframe of skilled and interested with dummies for each skill/interest
interestedLists = records["Interests"].dropna()
skilledLists = records["Skills"].dropna()
interested = pd.get_dummies(interestedLists.apply(pd.Series).stack()).sum(level=0)
skilled = pd.get_dummies(skilledLists.apply(pd.Series).stack()).sum(level=0)

## Get dictionary with key skill and value list of learners
learners_by_skill = {}
for column in interested.columns:
    learners_by_skill[column] = list(interested[interested[column] == 1].index)

## Get dictionary with key skill and value list of masters
masters_by_skill = {}
for column in skilled.columns:
    masters_by_skill[column] = list(skilled[skilled[column] == 1].index)

## Get dictionary with key master and value list of skills
skills_by_master = {}
for index, row in skilled.iterrows():
    skills_by_master[index] = list(skilled.transpose()[skilled.transpose()[index] == 1].index)

## Get dictionary with key learner and value list of skills
skills_by_learner = {}
for index, row in interested.iterrows():
    skills_by_learner[index] = list(interested.transpose()[interested.transpose()[index] == 1].index)



import networkx as nx
from networkx.algorithms import bipartite

allSkills = set(list(list(learners_by_skill.keys()) + list(masters_by_skill)))
allPeople = set(list(list(skills_by_learner.keys()) + list(skills_by_master)))


g = nx.DiGraph()
for skill, masters in masters_by_skill.items():
    for master in masters:
        learners = learners_by_skill.get(skill, [])
        for learner in learners:
            if master != learner:
                g.add_edge("T %s" % master, "L %s" % learner)
for skill, learners in learners_by_skill.items():
    for learner in learners:
        masters = masters_by_skill.get(skill, [])
        for master in masters:
            if master != learner:
                g.add_edge("T %s" % master, "L %s" % learner)


# Save the graph as PNG (optional)
# a = nx.drawing.nx_agraph.to_agraph(g)
# a.draw("connections.png", prog="dot")


# Find maximal matching
# TODO: for some reason NetworkX does not return the largest possible
# maximal matching. For now I am manually running this again and again
# trying to increase the cardinality of the matching but this needs fixing

maxmatch = nx.algorithms.matching.maximal_matching(g.to_undirected())


# Pretty-print output
# TODO: return a result in JSON or CSV format

# Pretty-print output
# TODO: return a result in JSON or CSV format

today = time.strftime("%d/%m/%Y")

paired_count = len(maxmatch)
print("Pairs generated: %s/%s" % (paired_count, len(allPeople)))
matched = set()
print("Pairing:")
for (a,b) in maxmatch:
    if a.startswith("T"):
        (t, l) = (a, b)
    else:
        (t, l) = (b, a)
    (tp, lp) = (remove_prefix(t, "T "), remove_prefix(l, "L "))
    matched.add(tp)
    matched.add(lp)
    ts = set(skills_by_master.get(tp, []))
    ls = set(skills_by_learner.get(lp, []))
    common = ts.intersection(ls)
    print("%s teaching %s about '%s'" % (tp, lp,"' or '".join(list(common))))
    at.create("Pairings", {
        "Teacher": tp,
        "Learner": lp,
        "Skill": str(list(common)[0]),
        "Paired On": today
    })
if paired_count < len(allPeople):
    print("People left out:")
    leftOut = allPeople.difference(matched)
    print(leftOut)
    for p in leftOut:
        at.create("Pairings", {
            "Teacher": p,
            "Learner": p,
            "Not Paired": True,
            "Paired On": today
        })