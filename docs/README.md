# CareerBird Frontend Documentation

## 📚 Documentation Structure

This documentation is organized by functionality for easy navigation:

### 🎯 **Start Here**
- [**Architecture Overview**](./ARCHITECTURE_OVERVIEW.md) - **Complete system overview with all details**

### 🏗️ **Architecture & System Design**
- [**Template Architecture**](./TEMPLATE_ARCHITECTURE.md) - Template system deep dive
- [**Color Management**](./COLOR_MANAGEMENT.md) - Centralized color handling
- [**CSS Generation**](./CSS_GENERATION.md) - How CSS is generated per template

### 🔄 **Data Flow & Processes**
- [**Preview Generation**](./PREVIEW_GENERATION.md) - How previews are created
- [**PDF Generation**](./PDF_GENERATION.md) - PDF download process

### 🛠️ **Development & Support**
- [**Migration Guide**](./MIGRATION_GUIDE.md) - From old to new system
- [**Troubleshooting**](./TROUBLESHOOTING.md) - Common issues and solutions

## 🚀 Quick Start

1. **Complete Overview**: Start with [**Architecture Overview**](./ARCHITECTURE_OVERVIEW.md) - **Everything in one place**
2. **Understanding Templates**: Read [Template Architecture](./TEMPLATE_ARCHITECTURE.md)
3. **Color System**: Check [Color Management](./COLOR_MANAGEMENT.md)
4. **Development**: See [Migration Guide](./MIGRATION_GUIDE.md)

## 🔍 Key Concepts

### The Problem We Solved
- **Color Persistence**: Colors were sticking after PDF downloads ❌ → ✅ **FIXED**
- **Preview ≠ PDF**: Different rendering paths ❌ → ✅ **FIXED** 
- **Scattered CSS**: Multiple files ❌ → ✅ **CENTRALIZED**

### Template Support Reality
- **Fully Supported**: `navy-column-modern`, `modern-executive` (Dynamic CSS + Colors)
- **HTML Only**: 10+ other templates (Need CSS generation added)
- **Color System**: Each template has specific color palettes

### Architecture
```
Frontend (12+ Templates) → Backend (2 CSS Generators) → Centralized Service → Preview = PDF
```

## 📋 Current Status

### ✅ Implemented
- Centralized template rendering service
- Color management with cache clearing
- Preview and PDF consistency
- Support for 2 main templates

### 🚧 In Progress
- Extending CSS generation to all templates
- Enhanced color picker per template
- Performance optimizations

### 📝 Planned
- Template builder interface
- Advanced color customization
- Template marketplace

## 🆘 Need Help?

- **Issues**: Check [Troubleshooting](./TROUBLESHOOTING.md)
- **Development**: See [Migration Guide](./MIGRATION_GUIDE.md)
- **New Features**: Read [Adding Templates](./ADDING_TEMPLATES.md)

---

**Last Updated**: December 2024  
**Version**: 2.0 (Centralized Architecture)