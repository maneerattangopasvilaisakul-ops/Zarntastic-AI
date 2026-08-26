import fs from 'fs';

let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');

// Replace the main flex container
content = content.replace(
  '<div className="flex items-center justify-between h-16 sm:h-20">',
  '<div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2 py-3 lg:py-0 lg:h-20">'
);

// Logo & Title
content = content.replace(
  '{/* Logo & Title */}\n          <div className="flex items-center gap-3 cursor-pointer"',
  '{/* Logo & Title */}\n          <div className="flex items-center gap-3 cursor-pointer order-1"'
);

// Main Navigation
content = content.replace(
  '{/* Main Navigation */}\n          <div className="hidden lg:flex items-center gap-6 ml-8 mr-auto">',
  '{/* Main Navigation */}\n          <div className="w-full lg:w-auto flex items-center justify-center gap-6 order-3 lg:order-2 lg:ml-8 lg:mr-auto">'
);

// Global Search
content = content.replace(
  '{/* Global Search */}\n          <div className="hidden md:flex items-center ml-auto mr-4 xl:mr-0 z-10 relative">',
  '{/* Global Search */}\n          <div className="w-full md:w-auto flex items-center justify-center order-4 lg:order-3 lg:ml-auto lg:mr-4 xl:mr-0 z-10 relative">'
);

// Search Input relative width
content = content.replace(
  '<div className="relative w-48 lg:w-64">',
  '<div className="relative w-full max-w-md md:w-48 lg:w-64">'
);

// Contact & Hours Badges
content = content.replace(
  '{/* Contact & Hours Badges */}\n          <div className="hidden xl:flex items-center gap-3 xl:ml-4">',
  '{/* Contact & Hours Badges */}\n          <div className="w-full xl:w-auto flex items-center justify-center gap-3 order-5 xl:order-4 xl:ml-4">'
);

// Right Action buttons
content = content.replace(
  '{/* Right Action buttons */}\n          <div className="flex items-center gap-2 sm:gap-3">',
  '{/* Right Action buttons */}\n          <div className="flex items-center gap-2 sm:gap-3 order-2 lg:order-5 ml-auto lg:ml-0">'
);

fs.writeFileSync('src/components/Header.tsx', content);
