#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

class ReadmeValidator {
  constructor(readmePath) {
    this.readmePath = readmePath
    this.content = fs.readFileSync(readmePath, 'utf8')
    this.errors = []
    this.warnings = []
  }

  validate() {
    this.validateStructure()
    this.validateLinks()
    this.validateContent()
    this.validateFormatting()

    return {
      errors: this.errors,
      warnings: this.warnings,
      isValid: this.errors.length === 0,
    }
  }

  validateStructure() {
    // Check for required sections
    const requiredSections = [
      'Overview',
      'Deployment',
      'Build your app',
      'How It Works',
    ]
    requiredSections.forEach((section) => {
      if (!this.content.includes(`## ${section}`)) {
        this.errors.push(`Missing required section: ${section}`)
      }
    })

    // Check heading hierarchy
    const headings = this.content.match(/^#+\s.+$/gm) || []
    if (headings.length === 0) {
      this.errors.push('No headings found')
      return
    }

    if (!headings[0].startsWith('# ')) {
      this.errors.push('Document should start with h1 heading')
    }

    // Check for proper title
    if (!this.content.match(/^# Supabase Community Starter/m)) {
      this.errors.push('Missing or incorrect main title')
    }
  }

  validateLinks() {
    const links = this.content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []

    links.forEach((link) => {
      const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (!match) return

      const text = match[1]
      const url = match[2]

      if (!text.trim()) {
        this.errors.push(`Empty link text: ${link}`)
      }

      if (!url.trim()) {
        this.errors.push(`Empty URL: ${link}`)
      }

      if (url.startsWith('http') && !url.match(/^https?:\/\/.+\..+/)) {
        this.warnings.push(`Potentially invalid URL format: ${url}`)
      }

      // Check for spaces in URLs
      if (url.includes(' ')) {
        this.errors.push(`URL contains spaces: ${url}`)
      }
    })

    // Check for expected project URLs
    const expectedUrls = [
      'vercel.com/fvvkkukf-7000s-projects/v0-supabase-community-starter',
      'v0.dev/chat/projects/HmBLX3zIVNF',
    ]

    expectedUrls.forEach((expectedUrl) => {
      if (!this.content.includes(expectedUrl)) {
        this.warnings.push(`Expected URL not found: ${expectedUrl}`)
      }
    })

    // Validate badge links
    const badgePattern = /!\[[^\]]*\]\([^)]*shields\.io[^)]*\)/g
    const badges = this.content.match(badgePattern) || []

    if (badges.length < 2) {
      this.warnings.push('Expected at least 2 badges (Vercel and v0.dev)')
    }
  }

  validateContent() {
    // Check for placeholder content
    const placeholders = ['TODO', 'FIXME', 'XXX', 'placeholder']
    placeholders.forEach((placeholder) => {
      if (this.content.toLowerCase().includes(placeholder.toLowerCase())) {
        this.warnings.push(`Contains placeholder text: ${placeholder}`)
      }
    })

    // Check for consistent project naming
    const projectMentions =
      this.content.match(/supabase.community.starter/gi) || []
    if (projectMentions.length === 0) {
      this.warnings.push('No project name mentions found')
    }

    // Verify key concepts are covered
    const keyConcepts = ['v0.dev', 'Vercel', 'automatically', 'sync']
    keyConcepts.forEach((concept) => {
      if (!this.content.toLowerCase().includes(concept.toLowerCase())) {
        this.warnings.push(`Key concept not mentioned: ${concept}`)
      }
    })

    // Check for deployment workflow description
    const workflowSteps = [
      'Create and modify',
      'Deploy your chats',
      'automatically pushed',
      'Vercel deploys',
    ]

    workflowSteps.forEach((step) => {
      if (!this.content.toLowerCase().includes(step.toLowerCase())) {
        this.warnings.push(`Missing workflow step: ${step}`)
      }
    })
  }

  validateFormatting() {
    const lines = this.content.split('\n')

    // Check for trailing whitespace
    lines.forEach((line, index) => {
      if (line.match(/\s+$/)) {
        this.warnings.push(`Trailing whitespace on line ${index + 1}`)
      }
    })

    // Check for consistent badge formatting
    const badges =
      this.content.match(/!\[[^\]]*\]\([^)]*shields\.io[^)]*\)/g) || []
    badges.forEach((badge) => {
      if (!badge.includes('style=for-the-badge')) {
        this.warnings.push(`Badge missing consistent styling: ${badge}`)
      }
      if (!badge.includes('black')) {
        this.warnings.push(`Badge not using consistent color scheme: ${badge}`)
      }
    })

    // Check file ends with newline
    if (!this.content.endsWith('\n')) {
      this.warnings.push('File should end with a newline')
    }

    // Check for empty sections
    const sections = this.content.split(/^##\s/m)
    sections.slice(1).forEach((section, index) => {
      const sectionContent = section.split('\n').slice(1).join('\n').trim()
      if (sectionContent.length === 0) {
        this.errors.push(`Empty section found at index ${index + 1}`)
      }
    })

    // Check for consistent emphasis formatting
    const boldTexts = this.content.match(/\*\*[^*]+\*\*/g) || []
    boldTexts.forEach((boldText) => {
      if (boldText.match(/\*\*\s/) || boldText.match(/\s\*\*/)) {
        this.warnings.push(`Improper bold formatting: ${boldText}`)
      }
    })
  }
}

// Run validation if called directly
if (require.main === module) {
  const readmePath = path.join(__dirname, '../../README.md')
  const validator = new ReadmeValidator(readmePath)
  const result = validator.validate()

  console.log('README.md Validation Results:')
  console.log('============================')

  if (result.errors.length > 0) {
    console.log('\nErrors:')
    result.errors.forEach((error) => console.log(`  ❌ ${error}`))
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:')
    result.warnings.forEach((warning) => console.log(`  ⚠️  ${warning}`))
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('\n✅ README.md is valid with no issues!')
  } else if (result.isValid) {
    console.log('\n✅ README.md is valid but has warnings')
  } else {
    console.log('\n❌ README.md has validation errors')
    process.exit(1)
  }
}

module.exports = ReadmeValidator
