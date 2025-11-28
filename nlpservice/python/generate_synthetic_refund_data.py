"""
generate_synthetic_refund_data.py

Generate a large synthetic dataset (CSV) for refund prediction.
Fields: reason_text, delay_days, rating, refund_percent
Default: 2000 rows (configurable via --n)

Usage:
  python generate_synthetic_refund_data.py --n 2000 --out data/refund_dataset.csv

The generator uses templates and randomization to simulate realistic complaints
and correlates refund_percent with severity, delay_days, and rating.
"""

import csv
import random
import argparse
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

# severity levels map to base refund percent
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


def sample_row():
    kind = random.choices(list(TEMPLATES.keys()), weights=[5,1,6,10,20,7,3,6,4])[0]
    template = random.choice(TEMPLATES[kind])

    # delay days: sample depending on kind
    if kind == 'never_delivered':
        delay = random.randint(15, 60)
    elif kind in ('late_missing', 'communication'):
        delay = random.randint(1, 14)
    elif kind in ('broken', 'partial_delivery'):
        delay = random.randint(0, 10)
    else:
        delay = random.randint(0, 7)

    # Helper to return human-friendly day phrase
    def day_phrase(d):
        if d == 0:
            return "on time"
        if d == 1:
            return "1 day"
        return f"{d} days"

    # Ensure the reason_text mentions the delay explicitly and consistently.
    # If the chosen template contains a {d} placeholder, format it. Otherwise,
    # append a short sentence clarifying the delay.
    try:
        if "{d}" in template:
            reason_text = template.format(d=delay)
        else:
            # For cases like 'never_delivered', the template already implies severity;
            # append an explicit delay phrase for clarity and downstream parsing.
            if kind == 'never_delivered':
                reason_text = f"{template} No delivery after {day_phrase(delay)}."
            elif delay == 0:
                # If no delay, prefer to state 'delivered on time' or keep template if positive.
                reason_text = f"{template} Delivered on time."
            else:
                reason_text = f"{template} Delayed by {day_phrase(delay)}."
    except Exception:
        # Fallback: ensure text contains delay
        reason_text = f"{template} Delayed by {day_phrase(delay)}."

    # rating correlated: good -> high, severe kinds -> low
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

    # base refund from severity
    base = SEVERITY_BASE.get(kind, 20)

    # adjust with delay and rating: delay adds up to +15% for long delays, rating subtracts
    delay_adj = min(delay / 30.0 * 30.0, 30.0)  # up to +30
    rating_adj = (3 - rating) * 10.0  # if rating<3 increases refund, if >3 will be negative

    # small noise
    noise = random.gauss(0, 6)

    refund = base + 0.6 * delay_adj + rating_adj + noise
    refund = max(0.0, min(100.0, round(refund, 2)))

    return {
        'reason_text': reason_text,
        'delay_days': delay,
        'rating': rating,
        'refund_percent': refund,
        'kind': kind,
    }


def generate(n=2000, out_path=None, include_kind=False):
    if out_path is None:
        out_dir = OUT_DIR
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f'refund_dataset_{n}.csv')
    else:
        os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)

    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['reason_text', 'delay_days', 'rating', 'refund_percent']
        if include_kind:
            fieldnames.append('kind')
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for i in range(n):
            row = sample_row()
            out = {k: row[k] for k in fieldnames}
            writer.writerow(out)

    print(f'Wrote {n} rows to {out_path}')
    return out_path


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--n', type=int, default=2000, help='Number of rows to generate')
    parser.add_argument('--out', type=str, default=None, help='Output CSV path')
    parser.add_argument('--include-kind', action='store_true', help='Include the synthetic "kind" label for analysis')
    args = parser.parse_args()
    generate(n=args.n, out_path=args.out, include_kind=args.include_kind)
