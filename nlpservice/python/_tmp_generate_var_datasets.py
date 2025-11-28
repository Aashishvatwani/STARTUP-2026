"""
Helper script used to generate 4 datasets programmatically from the current generator logic.
This script ran inside the assistant to produce CSV files; it is left here for reproducibility.
"""
import random
import csv
import os

TEMPLATES = {
    'late_missing': [
        "Work delivered {d} days late and several important features are missing.",
        "Project arrived {d} days late; major sections were not implemented.",
        "Delivered after {d} days delay with missing functionality and poor testing."
    ],
    'never_delivered': [
        "Freelancer never delivered the project despite multiple reminders.",
        "Project was not delivered — no delivery after repeated promises.",
        "I paid but the work was never provided."
    ],
    'broken': [
        "Delivered but major parts are broken and throw errors.",
        "The delivered code crashes and is unusable.",
        "Builds fail and critical functionality is broken; not acceptable."
    ],
    'minor_issues': [
        "Minor UI tweaks are missing; mostly fine.",
        "Small styling problems and one button misaligned.",
        "Few small adjustments required; overall acceptable."
    ],
    'good': [
        "Excellent work — delivered on time and matches requirements.",
        "Great job, timely delivery, very satisfied.",
        "On time and high quality. No issues.",
    ],
    'communication': [
        "Freelancer was unresponsive and delayed the schedule.",
        "Poor communication caused a delay of {d} days and confusion.",
    ],
    'overcharged': [
        "Work seems overpriced and several deliverables are incomplete.",
        "Charged more than agreed and skipped parts of the scope.",
    ],
    'partial_delivery': [
        "Partially delivered: only 60% of features are present.",
        "Half the scope is missing; promised APIs were not implemented.",
    ],
    'wrong_scope': [
        "Delivered the wrong project—doesn't match the spec.",
        "The freelancer implemented a different feature set than requested.",
    ],
}

SEVERITY_BASE = {
    'never_delivered': 100,
    'late_missing': 70,
    'broken': 80,
    'partial_delivery': 65,
    'overcharged': 50,
    'wrong_scope': 60,
    'communication': 40,
    'minor_issues': 15,
    'good': 0,
}

OUT_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(OUT_DIR, exist_ok=True)


def day_phrase(d):
    if d == 0:
        return "on time"
    if d == 1:
        return "1 day"
    return f"{d} days"


def sample_row(kind=None):
    kinds = list(TEMPLATES.keys())
    # slightly different weights per dataset if needed
    kind = kind or random.choices(kinds, weights=[5,1,6,10,20,7,3,6,4])[0]
    template = random.choice(TEMPLATES[kind])

    if kind == 'never_delivered':
        delay = random.randint(15, 60)
    elif kind in ('late_missing', 'communication'):
        delay = random.randint(1, 14)
    elif kind in ('broken', 'partial_delivery'):
        delay = random.randint(0, 10)
    else:
        delay = random.randint(0, 7)

    if "{d}" in template:
        reason_text = template.format(d=delay)
    else:
        if kind == 'never_delivered':
            reason_text = f"{template} No delivery after {day_phrase(delay)}."
        elif delay == 0:
            reason_text = f"{template} Delivered on time."
        else:
            # randomly sometimes use words for numbers
            if random.random() < 0.25:
                # spell number for 1-10
                words = {1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten'}
                dp = words.get(delay, str(delay))
                reason_text = f"{template} Delayed by {dp} days."
            else:
                reason_text = f"{template} Delayed by {day_phrase(delay)}."

    if kind == 'good':
        rating = random.choices([4,5], [0.3, 0.7])[0]
    elif kind == 'minor_issues':
        rating = random.choices([2,3,4], [0.1,0.6,0.3])[0]
    elif kind == 'never_delivered':
        rating = random.choices([1,2], [0.9,0.1])[0]
    elif kind in ('broken','late_missing','partial_delivery','wrong_scope'):
        rating = random.choices([1,2,3], [0.6,0.25,0.15])[0]
    elif kind == 'communication':
        rating = random.choices([1,2,3,4], [0.4,0.3,0.2,0.1])[0]
    else:
        rating = random.randint(1,5)

    base = SEVERITY_BASE.get(kind, 20)
    delay_adj = min(delay / 30.0 * 30.0, 30.0)
    rating_adj = (3 - rating) * 10.0
    noise = random.gauss(0, 6)
    refund = base + 0.6 * delay_adj + rating_adj + noise
    refund = max(0.0, min(100.0, round(refund, 2)))

    # price correlated lightly with kinds
    price = round(random.uniform(500, 25000) * (1.0 + (5 - rating) * 0.02), 2)

    return reason_text.replace('"','""'), delay, rating, price, refund, kind


def generate_file(path, n, seed=42, variant=1):
    random.seed(seed)
    with open(path, 'a', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        for i in range(n):
            # vary weights per variant
            if variant == 1:
                kind = None
            elif variant == 2:
                kind = random.choices(list(TEMPLATES.keys()), weights=[3,2,8,12,18,6,4,5,2])[0]
            elif variant == 3:
                kind = random.choices(list(TEMPLATES.keys()), weights=[6,1,5,8,10,9,5,7,4])[0]
            else:
                kind = random.choices(list(TEMPLATES.keys()), weights=[4,1,7,10,22,4,3,6,3])[0]
            rt, d, r, p, ref, k = sample_row(kind=kind)
            writer.writerow([rt, d, r, p, ref, k])


if __name__ == '__main__':
    # produce 4 files of 5000 rows each, seeds differ for variety
    paths = [
        os.path.join(OUT_DIR, 'refund_dataset_var1_5000.csv'),
        os.path.join(OUT_DIR, 'refund_dataset_var2_5000.csv'),
        os.path.join(OUT_DIR, 'refund_dataset_var3_5000.csv'),
        os.path.join(OUT_DIR, 'refund_dataset_var4_5000.csv'),
    ]
    seeds = [1001, 2022, 3033, 4044]
    for idx, p in enumerate(paths):
        generate_file(p, 5000, seed=seeds[idx], variant=idx+1)
    print('Generated 4 varied datasets (5000 rows each).')