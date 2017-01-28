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


# Parsing the input CSV file exported from Google Spreadsheets
# TODO: this part is tied to the current structure of the spreadsheet,
# which is not great and should be changed.
# A much more robust, easier to parse structure would be:
#   person,learns_or_teaches,skill
#   Alice,learns,Javascript
#   Bob,teaches,Python

if len(sys.argv) < 2:
    print("Usage: python pairing.py path/to/file.csv")
    exit(1)
with open(sys.argv[1]) as csvfile:
    rows = list(csv.reader(csvfile))

skills = None
interests = None

ppl = set()
masters_by_skill = {}
learners_by_skill = {}
skills_by_master = {}
skills_by_learner = {}

# given a dictionary d, initializes d[k] to an empty list and appends v to it
def append_to_list_at_key(d, k, v):
    if d.get(k) is None:
        d[k] = []
    d[k].append(v)
    return d

# removes prefix from string
def remove_prefix(text, prefix):
    return text[text.startswith(prefix) and len(prefix):]

i = 0
for row in rows:
    if i == 0:
        # row 0 gives what people want to learn
        interests = row
    elif i == 13:
        # row 13 gives what people can teach
        # TODO: this will break when the spreadsheet changes...
        skills = row
    else:
        j = 0
        for person in row:
            if isinstance(person, str) and len(person) > 0:
                person = remove_prefix(person, "@").lower()
                ppl.add(person)
                if skills is not None:
                    append_to_list_at_key(masters_by_skill, skills[j], person)
                    append_to_list_at_key(skills_by_master, person, skills[j])
                elif interests is not None:
                    append_to_list_at_key(learners_by_skill, interests[j], person)
                    append_to_list_at_key(skills_by_learner, person, interests[j])
            j += 1
    i += 1


# Some logs for debugging/inspecting
# print("MASTERS", masters_by_skill)
# print("LEARNERS", learners_by_skill)
# print("BY LEARNER:", skills_by_learner)
# print("BY MASTER:", skills_by_master)


# Building the graph

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

paired_count = len(maxmatch)
print("Pairs generated: %s/%s" % (paired_count, len(ppl)))
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
if paired_count < len(ppl):
    print("People left out:")
    print(ppl.difference(matched))
