import re

with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if i >= 610:
        if re.match(r'^ +$', lines[i].rstrip('\n')):
            # Before replacing, remove the previously added </div> if any (it failed anyway because of regex error)
            # Actually I just append </div>
            lines[i] = lines[i].rstrip('\n') + '</div>\n'

with open('src/components/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
