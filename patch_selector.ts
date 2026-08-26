import fs from 'fs';
let content = fs.readFileSync('src/components/CourseSelector.tsx', 'utf-8');
content = content.replace(
  'interface CourseSelectorProps {\n  selectedCourse: Course | null;\n  onSelectCourse: (course: Course) => void;\n  onOpenDetails: (course: Course) => void;\n}\n\nexport function CourseSelector({\n  selectedCourse,\n  onSelectCourse,\n  onOpenDetails,\n}: CourseSelectorProps) {',
  `interface CourseSelectorProps {
  selectedCourse: Course | null;
  onSelectCourse: (course: Course) => void;
  onOpenDetails: (course: Course) => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (query: string) => void;
}

export function CourseSelector({
  selectedCourse,
  onSelectCourse,
  onOpenDetails,
  globalSearchQuery = '',
  onGlobalSearchChange,
}: CourseSelectorProps) {`
);

content = content.replace(
  'const [searchQuery, setSearchQuery] = useState<string>(\'\');',
  'const [localSearchQuery, setLocalSearchQuery] = useState<string>(\'\');\n  const searchQuery = globalSearchQuery || localSearchQuery;\n  const setSearchQuery = onGlobalSearchChange || setLocalSearchQuery;'
);

fs.writeFileSync('src/components/CourseSelector.tsx', content);
