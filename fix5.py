import re

with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() == '':
        if len(line) > 1: # it has spaces but no text (excluding just \n)
            # wait, a line with just \n has len 1. A line with spaces has len > 1.
            # let's be safe
            pass
