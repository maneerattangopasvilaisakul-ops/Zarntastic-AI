with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '{lineTestResult && (' in line:
        if lines[i-1].strip() == '</div>':
            lines[i-1] = ''

with open('src/components/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
