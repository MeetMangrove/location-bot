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

import networkx as nx
import matplotlib.pyplot as plt
import time
import json
import pandas as pd
import airtable



with open('settings.json') as settings_file:
    settings = json.load(settings_file)

at = airtable.AT(settings["airtable_base_key"],settings["airtable_api_key"])
records = at.getTable("P2PL Tests")

# removes prefix from string
def remove_prefix(text, prefix):
    return text[text.startswith(prefix) and len(prefix):]

## Get a dataframe of records for interests and skills
records = records.set_index("Slack Handle")
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

today = time.strftime("%Y-%m-%d")

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
    # print("%s teaching %s about '%s'" % (tp, lp,"' or '".join(list(common))))

    obj = {
        "Teacher": tp,
        "Learner": lp,
        "Skill": ", ".join(list(common)),
        "Paired On": today
    }
    res = at.pushToTable("Pairings", obj, typecast=True)
    # print(res)
if paired_count < len(allPeople):
    print("People left out:")
    leftOut = allPeople.difference(matched)
    print(leftOut)
    for p in leftOut:
        at.pushToTable("Pairings", {
            "Teacher": p,
            "Learner": p,
            "Not Paired": True,
            "Paired On": today
        })