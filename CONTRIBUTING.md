# Contributing to MapVue

Thank you for your interest in contributing to MapVue! This document provides guidelines and information for contributors to help maintain a high-quality, collaborative project.

## 🎯 Overview

MapVue is a professional GIS web application featuring a beautiful macOS-style interface. We welcome contributions from developers, designers, GIS professionals, and users who want to help improve the project.

## 🤝 How to Contribute

### Types of Contributions
- **Bug Reports**: Help identify and fix issues
- **Feature Requests**: Suggest new functionality
- **Code Contributions**: Implement features or fix bugs
- **Documentation**: Improve guides, APIs docs, and examples
- **Testing**: Write tests and improve test coverage
- **Design**: UI/UX improvements and design suggestions
- **Translation**: Internationalization support

### Getting Started
1. **Fork the Repository**: Click the "Fork" button on GitHub
2. **Clone Your Fork**: `git clone https://github.com/yourusername/mapvue.git`
3. **Set Up Development Environment**: Follow the setup guide in README.md
4. **Create a Branch**: `git checkout -b feature/your-feature-name`
5. **Make Changes**: Implement your feature or fix
6. **Test Your Changes**: Ensure all tests pass
7. **Submit a Pull Request**: Create a PR with a clear description

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ with PostGIS
- Git
- Modern web browser

### Setup Steps
```bash
# Clone your fork
git clone https://github.com/yourusername/mapvue.git
cd mapvue

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..

# Set up database
cd backend/database
.\setup.ps1  # Windows
# or
./setup.sh   # Linux/Mac

# Set up environment
cd ../
cp .env.example .env
# Edit .env with your database credentials

# Start development servers
npm run dev  # Starts both frontend and backend
```

## 📋 Code Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Avoid `any` types - use proper typing
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Follow React hooks rules (use eslint-plugin-react-hooks)
- Use TypeScript interfaces for component props
- Implement proper key props for lists

### Backend Standards
- Use Express.js best practices
- Implement proper error handling middleware
- Use parameterized queries for database operations
- Follow RESTful API conventions
- Add comprehensive input validation

### Database Standards
- Use PostGIS for all spatial operations
- Implement proper spatial indexes
- Use UUIDs for primary keys
- Follow PostgreSQL naming conventions
- Add proper foreign key constraints

## 🎨 UI/UX Guidelines

### macOS Design Principles
- Maintain glassmorphism effects and blur backgrounds
- Use proper macOS-style window controls (traffic lights)
- Implement smooth animations and transitions
- Follow Apple's Human Interface Guidelines where applicable
- Maintain consistent spacing and typography

### Component Design
- Create reusable, modular components
- Use Tailwind CSS for styling consistency
- Implement proper responsive design
- Add proper accessibility attributes
- Test on multiple screen sizes

### Icon Usage
- Use Lucide React icons consistently
- Maintain icon size consistency (24px default)
- Use semantic icons that match functionality
- Provide alt text for accessibility

## 🧪 Testing Guidelines

### Frontend Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Backend Testing
```bash
cd backend
npm run test
npm run test:e2e
```

### Testing Requirements
- Write unit tests for all new functions
- Add integration tests for API endpoints
- Test error scenarios and edge cases
- Maintain minimum 80% code coverage
- Test on multiple browsers for frontend changes

## 📚 Documentation Standards

### Code Documentation
- Add JSDoc comments for all public functions
- Document complex algorithms and business logic
- Include parameter types and return values
- Add usage examples for utility functions

### API Documentation
- Document all new API endpoints
- Include request/response examples
- Document error codes and messages
- Update OpenAPI/Swagger specifications

### User Documentation
- Update user guides for new features
- Include screenshots for UI changes
- Write clear step-by-step instructions
- Test documentation with new users

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues to avoid duplicates
2. Test with the latest version
3. Try to reproduce the issue consistently
4. Check browser console for errors

### Bug Report Template
```markdown
**Describe the Bug**
A clear and concise description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 96]
- Version: [e.g., v1.2.0]

**Additional Context**
Any other context about the problem here.
```

## 🚀 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context, mockups, or examples.

**Implementation suggestions**
If you have technical suggestions for implementation.
```

## 🔄 Pull Request Process

### Before Submitting
1. Ensure your branch is up to date with main
2. Run all tests and ensure they pass
3. Update documentation if needed
4. Add appropriate labels to your PR

### PR Requirements
- **Clear Title**: Descriptive title that explains the change
- **Detailed Description**: What changed and why
- **Testing**: How the change was tested
- **Screenshots**: For UI changes, include before/after screenshots
- **Breaking Changes**: Clearly mark any breaking changes

### PR Template
```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests that you ran to verify your changes.

## Screenshots (if applicable)
Add screenshots to show the changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## 👥 Code Review Process

### For Contributors
- Respond promptly to review feedback
- Make requested changes in separate commits
- Explain your reasoning for implementation decisions
- Be open to suggestions and improvements

### For Reviewers
- Be constructive and respectful in feedback
- Focus on code quality, security, and maintainability
- Test the changes locally when possible
- Approve PRs that meet the project standards

## 🏷️ Commit Message Guidelines

### Format
```
type(scope): short description

Longer description if needed.

Fixes #123
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(drawing): add polygon drawing tool with OpenLayers integration

Add complete polygon drawing functionality including:
- Click to add vertices
- Double-click to complete polygon
- Visual feedback during drawing
- Integration with feature storage

Fixes #45
```

## 🌐 Translation and Internationalization

### Adding New Languages
1. Create language file in `frontend/src/locales/`
2. Translate all interface strings
3. Add language option to settings
4. Test RTL languages properly
5. Update documentation

### Translation Guidelines
- Keep translations concise but clear
- Maintain context and meaning
- Test UI layout with longer translations
- Use proper cultural conventions

## 📱 Platform-Specific Guidelines

### Web Browsers
- Test on Chrome, Firefox, Safari, and Edge
- Ensure mobile browser compatibility
- Test GPS features on supported browsers
- Verify file operations across browsers

### Mobile Devices
- Test touch interactions
- Verify responsive design
- Test GPS functionality
- Ensure readable text sizes

## 🔒 Security Considerations

### Frontend Security
- Sanitize all user inputs
- Validate file uploads
- Use HTTPS for production
- Implement proper CORS policies

### Backend Security
- Use parameterized queries
- Validate all API inputs
- Implement rate limiting
- Secure JWT token handling

### Database Security
- Use proper permissions
- Implement backup procedures
- Secure connection strings
- Regular security updates

## 🚀 Release Process

### Version Numbers
We follow Semantic Versioning (SemVer):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
1. Update version numbers
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Update documentation
6. Create GitHub release
7. Deploy to production

## 📞 Getting Help

### Community Resources
- **GitHub Discussions**: General questions and discussions
- **Issues**: Bug reports and feature requests
- **Wiki**: Community documentation and examples
- **Code Reviews**: Get feedback on your contributions

### Communication Channels
- **GitHub Issues**: Primary communication for bugs and features
- **Pull Requests**: Code review and discussion
- **Discussions**: General questions and community interaction

## 🏆 Recognition

### Contributors
All contributors are recognized in:
- README.md contributors section
- GitHub contributors list
- Release notes for significant contributions
- Community highlights in discussions

### Types of Recognition
- **Code Contributors**: Direct code contributions
- **Documentation Contributors**: Improve docs and guides
- **Community Contributors**: Help others and improve discussions
- **Bug Reporters**: Help identify and fix issues
- **Feature Advocates**: Suggest valuable improvements

## 📄 License

By contributing to MapVue, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🔄 Staying Updated

### Stay Informed
- Watch the GitHub repository for updates
- Read release notes for new versions
- Follow project discussions
- Subscribe to security advisories

### Regular Maintenance
- Keep your fork updated with upstream changes
- Update dependencies regularly
- Monitor for security vulnerabilities
- Participate in major version discussions

---

**Thank you for contributing to MapVue!** 🗺️✨

*Your contributions help make MapVue a better tool for GIS professionals and enthusiasts worldwide.*