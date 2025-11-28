"""
test_predict_refund.py

Improved test client for the refund prediction API.

Features:
- Concurrent requests using ThreadPoolExecutor
- CSV input support (columns: reason_text, delay_days, rating, price)
- Retries with exponential backoff
- Optional CSV output with responses
- Progress bar (tqdm) when available
- Rich summary: counts, latencies, refund stats, failed examples

Usage:
  python test_predict_refund.py --url http://localhost:8000/predict_refund --csv data/refund_dataset_2000.csv --concurrency 8 --output results.csv

Requirements: requests, tqdm (optional)
"""

import argparse
import csv
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from statistics import mean, median
import math
import random

import requests

try:
    from tqdm import tqdm
except Exception:
    tqdm = None


DEFAULT_URL = "http://localhost:8000/predict_refund"


def read_csv(path):
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            reason = (r.get('reason_text') or r.get('text') or '').strip()
            try:
                delay = int(float(r.get('delay_days', 0) or 0))
            except Exception:
                delay = 0
            try:
                rating = int(float(r.get('rating'))) if r.get('rating') not in (None, '') else None
            except Exception:
                rating = None
            try:
                price = float(r.get('price')) if r.get('price') not in (None, '') else 10000.0
            except Exception:
                price = 10000.0
            rows.append({"price": price, "reason_text": reason, "delay_days": delay, "rating": rating})
    return rows


def send_request(session, url, payload, timeout=10.0, retries=2, backoff=0.5):
    last_err = None
    for attempt in range(retries + 1):
        try:
            start = time.time()
            r = session.post(url, json=payload, timeout=timeout)
            elapsed = time.time() - start
            if r.status_code == 200:
                return True, r.json(), elapsed, None
            else:
                last_err = f"HTTP {r.status_code}: {r.text}"
        except Exception as e:
            last_err = str(e)
        # backoff
        time.sleep(backoff * (2 ** attempt))
    return False, None, 0.0, last_err


def run_tests(url, payloads, concurrency=4, timeout=10.0, retries=2, output_csv=None, show_failed=5, json_output=None):
    session = requests.Session()
    stats = {
        'total': len(payloads),
        'success': 0,
        'fail': 0,
        'latencies': [],
        'refunds': [],
        'errors': [],
        'responses': [],
    }

    progress = tqdm(total=len(payloads)) if tqdm else None

    with ThreadPoolExecutor(max_workers=concurrency) as ex:
        futures = {}
        for p in payloads:
            payload = {"price": float(p.get('price', 10000.0)),
                       "reason_text": p.get('reason_text', ''),
                       "delay_days": int(p.get('delay_days', 0))}
            if p.get('rating') is not None:
                try:
                    payload['rating'] = int(p.get('rating'))
                except Exception:
                    pass
            fut = ex.submit(send_request, session, url, payload, timeout, retries)
            futures[fut] = payload

        for fut in as_completed(futures):
            payload = futures[fut]
            ok, data, elapsed, err = fut.result()
            if ok:
                stats['success'] += 1
                stats['latencies'].append(elapsed)
                stats['refunds'].append(float(data.get('refund_percent', 0.0)))
                stats['responses'].append({'payload': payload, 'response': data})
            else:
                stats['fail'] += 1
                stats['errors'].append({'payload': payload, 'error': err})
            if progress:
                progress.update(1)

    if progress:
        progress.close()

    # Write CSV output if requested
    if output_csv:
        fieldnames = ['price', 'delay_days', 'rating', 'refund_percent', 'platform_fee', 'customer_refund', 'solver_amount']
        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in stats['responses']:
                resp = r['response']
                p = r['payload']
                writer.writerow({
                    'price': p.get('price'),
                    'delay_days': p.get('delay_days'),
                    'rating': p.get('rating'),
                    'refund_percent': resp.get('refund_percent'),
                    'platform_fee': resp.get('platform_fee'),
                    'customer_refund': resp.get('customer_refund'),
                    'solver_amount': resp.get('solver_amount'),
                })

    # Summary
    print('\nResults summary')
    print('---------------')
    print(f"Total: {stats['total']}")
    print(f"Success: {stats['success']}")
    print(f"Failed: {stats['fail']}")
    p95 = None
    if stats['latencies']:
        print(f"Avg latency: {mean(stats['latencies']):.3f}s")
        print(f"Median latency: {median(stats['latencies']):.3f}s")
        try:
            p95 = sorted(stats['latencies'])[max(0, math.floor(0.95 * len(stats['latencies'])) - 1)]
            print(f"95th pct latency: {p95:.3f}s")
        except Exception:
            p95 = None
    if stats['refunds']:
        print(f"Avg refund_percent: {mean(stats['refunds']):.2f}")
        print(f"Median refund_percent: {median(stats['refunds']):.2f}")

    if stats['errors']:
        print('\nSample failures:')
        for e in stats['errors'][:show_failed]:
            print('-', e['error'], 'payload:', e['payload'])

    # Optionally write JSON output including summary, successful responses and errors
    if json_output:
        summary = {
            'total': stats['total'],
            'success': stats['success'],
            'fail': stats['fail'],
            'avg_latency': mean(stats['latencies']) if stats['latencies'] else None,
            'median_latency': median(stats['latencies']) if stats['latencies'] else None,
            'p95_latency': p95,
            'avg_refund': mean(stats['refunds']) if stats['refunds'] else None,
            'median_refund': median(stats['refunds']) if stats['refunds'] else None,
        }
        out = {
            'summary': summary,
            'responses': stats['responses'],
            'errors': stats['errors'],
        }
        try:
            with open(json_output, 'w', encoding='utf-8') as jf:
                json.dump(out, jf, indent=2)
            print(f"\nWrote JSON output to: {json_output}")
        except Exception as e:
            print(f"Failed to write JSON output to {json_output}: {e}")

    return stats


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', type=str, default=DEFAULT_URL, help='Full URL to POST /predict_refund')
    parser.add_argument('--csv', type=str, default=None, help='Optional CSV file to iterate as test inputs')
    parser.add_argument('--concurrency', type=int, default=4, help='Number of concurrent requests')
    parser.add_argument('--timeout', type=float, default=10.0, help='Request timeout seconds')
    parser.add_argument('--retries', type=int, default=2, help='Retries per request')
    parser.add_argument('--output', type=str, default=None, help='Write successful responses to CSV')
    parser.add_argument('--show-failed', type=int, default=5, help='How many failed examples to print')
    parser.add_argument('--json-output', type=str, default=None, help='Write summary+responses to JSON file')
    args = parser.parse_args()

    if args.csv:
        print(f"Loading CSV: {args.csv}")
        payloads = read_csv(args.csv)
        if not payloads:
            print("CSV had no rows or failed to parse.")
            return
    else:
        # small default sample set
        payloads = [
            {"price": 10000.0, "reason_text": "Work delivered three days late and half features missing.", "delay_days": 3, "rating": 2},
            {"price": 8000.0, "reason_text": "Excellent work, on time and tested.", "delay_days": 0, "rating": 5},
            {"price": 5000.0, "reason_text": "Never received the deliverable after many promises.", "delay_days": 20, "rating": 1},
            {"price": 12000.0, "reason_text": "Delivered but major functionality is broken and crashes frequently.", "delay_days": 5, "rating": 2},
            {"price": 7000.0, "reason_text": "Small UI issues and one missing endpoint, delivered slightly late.", "delay_days": 2, "rating": 3},
        ]

    print(f"Testing endpoint: {args.url} with {len(payloads)} payload(s) using concurrency={args.concurrency}\n")
    stats = run_tests(args.url, payloads, concurrency=args.concurrency, timeout=args.timeout, retries=args.retries, output_csv=args.output, show_failed=args.show_failed, json_output=args.json_output)


if __name__ == '__main__':
    main()
