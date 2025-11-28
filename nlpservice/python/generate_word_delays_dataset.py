"""
generate_word_delays_dataset.py

Generate a dataset where any delay mentions in `reason_text` are expressed in words
(e.g., "Delayed by two days") to help the model learn word-number patterns.

Usage:
  python generate_word_delays_dataset.py --n 5000 --out data/refund_dataset_var5_5000.csv

The script outputs CSV with columns: reason_text,delay_days,rating,price,refund_percent,kind
"""
import csv
import random
import argparse
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), 'data')
NUM_WORDS = {
    0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
    10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen',
    17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty', 21: 'twenty-one', 22: 'twenty-two',
    23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five', 26: 'twenty-six', 27: 'twenty-seven',
    28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty', 31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three',
    34: 'thirty-four', 35: 'thirty-five', 36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight',
    39: 'thirty-nine', 40: 'forty', 41: 'forty-one', 42: 'forty-two', 43: 'forty-three', 44: 'forty-four',
    45: 'forty-five', 46: 'forty-six', 47: 'forty-seven', 48: 'forty-eight', 49: 'forty-nine', 50: 'fifty',
    51: 'fifty-one', 52: 'fifty-two', 53: 'fifty-three', 54: 'fifty-four', 55: 'fifty-five', 56: 'fifty-six',
    57: 'fifty-seven', 58: 'fifty-eight', 59: 'fifty-nine', 60: 'sixty'
}

TEMPLATES = {
    'late_missing': [
        "Work delivered {d_words} late and several important features are missing.",
        "Project arrived {d_words} late; major sections were not implemented.",
        "Delivered after a delay of {d_words} with missing functionality and poor testing."
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
        "Poor communication caused a delay of {d_words} and confusion.",
    ],
    'overcharged': [
        "Work seems overpriced and several deliverables are incomplete.",
        "Charged more than agreed and skipped parts of the scope.",
    ],
    'partial_delivery': [
        "Partially delivered: only sixty percent of features are present.",
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


def num_to_words(n: int) -> str:
    if n <= 60 and n in NUM_WORDS:
        return NUM_WORDS[n]
    # fallback: use digits spelled out
    return str(n)


def day_phrase_words(d: int) -> str:
    if d == 0:
        return "on time"
    if d == 1:
        return "one day"
    return f"{num_to_words(d)} days"


def sample_row_worded(kind=None):
    kinds = list(TEMPLATES.keys())
    kind = kind or random.choices(kinds, weights=[5,1,6,10,20,7,3,6,4])[0]
    template = random.choice(TEMPLATES[kind])

    # choose delay depending on kind
    if kind == 'never_delivered':
        delay = random.randint(15, 60)
    elif kind in ('late_missing', 'communication'):
        delay = random.randint(1, 14)
    elif kind in ('broken', 'partial_delivery'):
        delay = random.randint(0, 10)
    else:
        delay = random.randint(0, 7)

    d_words = day_phrase_words(delay)

    if "{d_words}" in template:
        reason_text = template.format(d_words=d_words)
    else:
        if kind == 'never_delivered':
            reason_text = f"{template} No delivery after {d_words}."
        elif delay == 0:
            reason_text = f"{template} Delivered on time."
        else:
            reason_text = f"{template} Delayed by {d_words}."

    # rating correlated
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

    price = round(random.uniform(500, 25000) * (1.0 + (5 - rating) * 0.02), 2)

    return {
        'reason_text': reason_text.replace('"','""'),
        'delay_days': delay,
        'rating': rating,
        'price': price,
        'refund_percent': refund,
        'kind': kind,
    }


def generate_worded(n=5000, out_path=None, seed=12345):
    if out_path is None:
        os.makedirs(OUT_DIR, exist_ok=True)
        out_path = os.path.join(OUT_DIR, f'refund_dataset_var5_{n}.csv')
    else:
        os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)

    random.seed(seed)
    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['reason_text','delay_days','rating','price','refund_percent','kind'])
        for i in range(n):
            row = sample_row_worded()
            writer.writerow([row['reason_text'], row['delay_days'], row['rating'], row['price'], row['refund_percent'], row['kind']])

    print(f'Wrote {n} rows to {out_path}')
    return out_path


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--n', type=int, default=5000, help='Number of rows')
    parser.add_argument('--out', type=str, default=None, help='Output CSV path')
    parser.add_argument('--seed', type=int, default=12345)
    args = parser.parse_args()
    generate_worded(n=args.n, out_path=args.out, seed=args.seed)
