const fs = require('fs')
const path = require('path')

describe('Markdown Linting and Structure Tests', () => {
  let readmeContent
  let lines

  beforeAll(() => {
    const readmePath = path.join(__dirname, '../../README.md')
    readmeContent = fs.readFileSync(readmePath, 'utf8')
    lines = readmeContent.split('\n')
  })

  describe('Markdown Syntax Validation', () => {
    test('should not have unescaped special characters in regular text', () => {
      lines.forEach((line, index) => {
        if (
          !line.startsWith('#') &&
          !line.startsWith('*') &&
          !line.startsWith('-') &&
          !line.startsWith('[')
        ) {
          expect(line).not.toMatch(/(?<!\[)[<>](?!\])/) // Unescaped angle brackets
        }
      })
    })

    test('should have consistent list formatting', () => {
      const orderedListItems = readmeContent.match(/^\d+\.\s/gm) || []
      const unorderedListItems = readmeContent.match(/^[\*\-]\s/gm) || []

      // If ordered lists exist, they should be formatted consistently
      if (orderedListItems.length > 0) {
        orderedListItems.forEach((item) => {
          expect(item).toMatch(/^\d+\.\s[A-Z]/) // Should start with capital letter
        })
      }

      // If unordered lists exist, they should be formatted consistently
      if (unorderedListItems.length > 0) {
        unorderedListItems.forEach((item) => {
          expect(item).toMatch(/^[\*\-]\s[A-Z]/) // Should start with capital letter
        })
      }
    })

    test('should not have empty sections', () => {
      const sections = readmeContent.split(/^##\s/m)
      sections.slice(1).forEach((section) => {
        // Skip first split part
        const content = section.split('\n').slice(1).join('\n').trim()
        expect(content.length).toBeGreaterThan(0)
      })
    })

    test('should have proper code block formatting', () => {
      const codeBlocks = readmeContent.match(/```[\s\S]*?```/g) || []
      codeBlocks.forEach((block) => {
        expect(block).toMatch(/^```.*\n[\s\S]*\n```$/)
      })
    })

    test('should have consistent emphasis markers', () => {
      // Check for proper bold formatting
      const invalidBold = readmeContent.match(/\*[^\*\s][^\*]*[^\*\s]\*/g) || []
      expect(invalidBold.length).toBe(0) // Should use ** for bold, not single *

      // Check for proper italic formatting (if any)
      const singleAsterisks =
        readmeContent.match(/(?<!\*)\*[^\*\s][^\*]*[^\*\s]\*(?!\*)/g) || []
      singleAsterisks.forEach((italic) => {
        expect(italic).not.toMatch(/\*\*/) // Should not be mixed with bold
      })
    })
  })

  describe('Content Structure Validation', () => {
    test('should have logical section ordering', () => {
      const sectionOrder = [
        'Overview',
        'Deployment',
        'Build your app',
        'How It Works',
      ]

      const content = readmeContent.toLowerCase()
      let lastIndex = -1

      sectionOrder.forEach((section) => {
        const index = content.indexOf(section.toLowerCase())
        expect(index).toBeGreaterThan(lastIndex)
        lastIndex = index
      })
    })

    test('should have appropriate content density', () => {
      const words = readmeContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length
      const nonEmptyLines = lines.filter(
        (line) => line.trim().length > 0,
      ).length

      expect(words).toBeGreaterThan(50) // Should have substantial content
      expect(words / nonEmptyLines).toBeGreaterThan(2) // Reasonable words per line ratio
    })

    test('should have consistent heading capitalization', () => {
      const headings = readmeContent.match(/^#+\s.+$/gm) || []
      headings.forEach((heading) => {
        const headingText = heading.replace(/^#+\s/, '')
        expect(headingText.charAt(0)).toMatch(/[A-Z]/) // Should start with capital
      })
    })

    test('should have proper paragraph separation', () => {
      const paragraphs = readmeContent.split(/\n\s*\n/)
      expect(paragraphs.length).toBeGreaterThan(3) // Should have multiple paragraphs
    })
  })

  describe('Link and Reference Validation', () => {
    test('should have consistent link formatting', () => {
      const markdownLinks =
        readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []

      markdownLinks.forEach((link) => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/)
        const linkText = match[1]
        const url = match[2]

        // Link text should not be empty or just whitespace
        expect(linkText.trim()).toBeTruthy()

        // URL should be properly formatted
        expect(url.trim()).toBeTruthy()
        expect(url).not.toContain(' ') // URLs should not contain spaces

        // URLs should be absolute for external links
        if (url.startsWith('http')) {
          expect(url).toMatch(/^https?:\/\/.+/)
        }
      })
    })

    test('should have consistent reference formatting', () => {
      // Check for consistent project ID references
      const vercelRefs = readmeContent.match(/fvvkkukf-7000s-projects/g) || []
      const v0Refs = readmeContent.match(/HmBLX3zIVNF/g) || []

      // Should appear multiple times consistently
      expect(vercelRefs.length).toBeGreaterThanOrEqual(2)
      expect(v0Refs.length).toBeGreaterThanOrEqual(2)
    })

    test('should not have broken link syntax', () => {
      // Check for malformed links
      expect(readmeContent).not.toMatch(/\[[^\]]*\]\([^)]*\s[^)]*\)/) // Links with spaces in URLs
      expect(readmeContent).not.toMatch(/\[\s*\]/) // Empty link text
      expect(readmeContent).not.toMatch(/\]\(\s*\)/) // Empty URLs
    })
  })

  describe('Professional Documentation Standards', () => {
    test('should use consistent terminology', () => {
      // Check for consistent service names
      const v0Mentions = readmeContent.match(/v0\.dev/g) || []
      const vercelMentions = readmeContent.match(/Vercel/gi) || []

      expect(v0Mentions.length).toBeGreaterThan(0)
      expect(vercelMentions.length).toBeGreaterThan(0)
    })

    test('should have professional tone and language', () => {
      // Should not contain informal language
      const informalWords = ['gonna', 'wanna', 'dunno', 'kinda', 'sorta']
      informalWords.forEach((word) => {
        expect(readmeContent.toLowerCase()).not.toContain(word)
      })
    })

    test('should have consistent project reference formatting', () => {
      // All references to the project should be consistent
      const projectRefs =
        readmeContent.match(/supabase.community.starter/gi) || []
      if (projectRefs.length > 1) {
        const variations = [
          ...new Set(projectRefs.map((ref) => ref.toLowerCase())),
        ]
        expect(variations.length).toBeLessThanOrEqual(2) // Allow for minor case variations
      }
    })

    test('should provide clear value proposition', () => {
      expect(readmeContent).toMatch(/automatically synced/i)
      expect(readmeContent).toMatch(/stay in sync/i)
      expect(readmeContent).toMatch(/continue building/i)
    })
  })
})
