#!/usr/bin/env python3
import os
import sys
import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
# Add backend/ to path so Django config (config.settings) is importable
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from apps.commission.serializers import CommissionDealSerializer
from apps.commission.models import CommissionDeal

qs = CommissionDeal.objects.all()
data = CommissionDealSerializer(qs, many=True).data

num_re = re.compile(r'^-?\d+(?:\.\d+)?$')

def normalize(o):
    if isinstance(o, list):
        return [normalize(v) for v in o]
    if isinstance(o, dict):
        return {k: normalize(v) for k, v in o.items()}
    if isinstance(o, str) and num_re.match(o):
        try:
            return float(o)
        except Exception:
            return o
    return o

print(json.dumps(normalize(data), indent=2, default=str))
