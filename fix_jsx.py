import re

with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the {onOpenShareLink && ( { /* ... */ } <button ... )}
content = re.sub(r'(\{onOpenShareLink && \(\s*)(\{/\*.*?\*/\}\s*<button)', r'\1<>\2', content, flags=re.DOTALL)
content = re.sub(r'(<span>ทดสอบส่งอีเมล</span>\s*</>\s*\)\}\s*</button>\s*)(\)\})', r'\1</>\2', content, flags=re.DOTALL)

with open('src/components/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
