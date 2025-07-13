# Documentation Template System

This template provides a comprehensive documentation framework for software projects, designed to work seamlessly with Claude Code (claude.ai/code) and maintain consistency across development sessions.

## 📁 Template Structure

```
template/
├── CLAUDE.md               # Claude Code guidance and session protocols
├── SESSION_STATE.md        # Session tracking and handoff documentation
├── README.md               # This file - template usage guide
└── docs/
    ├── project_context.md      # Master requirements and project overview
    ├── implementation_status.md # Feature tracking and progress monitoring
    ├── screen_specifications.md # UI/UX specifications for all screens
    ├── lessons_learned.md      # Development insights and debugging history
    ├── docs_change_log.md      # Documentation update tracking
    ├── design_system.md        # Design tokens and component library
    ├── folder_structure.md     # Project organization guidelines
    └── coding_standards.md     # Development standards and conventions
```

## 🚀 Quick Start

1. **Copy the template** to your new project root:
   ```bash
   cp -r template/* /path/to/your/project/
   cp -r template/docs /path/to/your/project/
   ```

2. **Replace placeholders** in all files:
   - Search for `[PLACEHOLDER_NAME]` patterns
   - Replace with your project-specific information
   - Common placeholders:
     - `[PROJECT_NAME]` - Your project name
     - `[DATE]` - Current date
     - `[FRAMEWORK]` - Your tech stack
     - `[DESCRIPTION]` - Project descriptions

3. **Initialize SESSION_STATE.md** with your first session
4. **Update CLAUDE.md** with project-specific commands and architecture
5. **Fill out project_context.md** as your master requirements document

## 📚 Documentation Files Overview

### Core Files

#### CLAUDE.md
- **Purpose**: Guide Claude Code for consistent development
- **Contains**: Session protocols, project overview, commands, architecture
- **Update**: At project start and when major changes occur

#### SESSION_STATE.md
- **Purpose**: Track development progress between sessions
- **Contains**: Current focus, recent changes, next steps, known issues
- **Update**: Start and end of every development session

### Documentation Suite (docs/)

#### project_context.md
- **Purpose**: Master requirements and business logic document
- **Priority**: 🔴 Critical - Single source of truth
- **Update**: Immediately when requirements change

#### implementation_status.md
- **Purpose**: Track feature completion and development progress
- **Update**: When features are completed or status changes

#### screen_specifications.md
- **Purpose**: Detailed UI/UX specifications for all screens
- **Update**: When designing new screens or modifying existing ones

#### lessons_learned.md
- **Purpose**: Capture debugging sessions and solutions
- **Update**: After debugging sessions >1 hour or finding non-obvious solutions

#### docs_change_log.md
- **Purpose**: Track all documentation updates
- **Update**: Automatically when other docs are modified

#### design_system.md
- **Purpose**: Design tokens, components, and style guide
- **Update**: When adding new components or design patterns

#### folder_structure.md
- **Purpose**: Project organization and file naming conventions
- **Update**: When project structure changes significantly

#### coding_standards.md
- **Purpose**: Code style, best practices, and review guidelines
- **Update**: Quarterly or when adopting new patterns

## 🔄 Workflow Integration

### Session Start
1. Read SESSION_STATE.md for context
2. Check implementation_status.md for feature status
3. Review recent lessons_learned.md entries
4. Note next steps from previous session

### During Development
- Update SESSION_STATE.md as tasks complete
- Mark features complete in implementation_status.md
- Document debugging sessions in lessons_learned.md
- Update specs when UI changes in screen_specifications.md

### Session End
1. Update SESSION_STATE.md with:
   - Completed work
   - Current blockers
   - Clear next steps
2. Update other docs as needed
3. Create change log entries

## 🎯 Best Practices

### Documentation Maintenance
- Keep documentation in sync with code
- Use clear, concise language
- Include examples where helpful
- Update immediately when changes occur

### Placeholder Convention
- Use `[BRACKETS]` for all placeholders
- Make placeholders descriptive
- Include instruction sections for complex templates
- Remove instruction sections after setup

### Version Control
- Commit documentation updates with code changes
- Use meaningful commit messages
- Keep documentation in the repository
- Review documentation in PRs

## 🛠️ Customization

### Adding New Templates
1. Create new `.md` file in appropriate location
2. Follow existing template patterns
3. Include usage instructions
4. Add to this README

### Removing Unnecessary Sections
- Delete files not needed for your project
- Remove sections within files that don't apply
- Keep the core workflow files (CLAUDE.md, SESSION_STATE.md)

### Framework-Specific Additions
- Add framework conventions to coding_standards.md
- Include platform guidelines in design_system.md
- Update folder_structure.md with framework patterns

## 📝 Example Usage

### Starting a New React Project
1. Copy template to project root
2. Replace placeholders:
   - `[PROJECT_NAME]` → "MyAwesomeApp"
   - `[FRAMEWORK]` → "React 18 with TypeScript"
   - `[PLATFORM]` → "Web"
3. Fill in initial requirements in project_context.md
4. Set up initial SESSION_STATE.md
5. Begin development with documentation-driven approach

## 🤝 Contributing

This template system is designed to evolve. When you discover improvements:
1. Update the templates with better patterns
2. Document the reasoning in lessons_learned.md
3. Share improvements with your team
4. Consider contributing back to the source

## 📄 License

This documentation template is provided as-is for use in any project. Adapt and modify as needed for your specific requirements.