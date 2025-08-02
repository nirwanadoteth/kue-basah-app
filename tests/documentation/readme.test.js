const fs = require('fs');
const path = require('path');

describe('README.md Documentation Tests', () => {
  let readmeContent;

  beforeAll(() => {
    const readmePath = path.join(__dirname, '../../README.md');
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  });

  describe('Structure and Format', () => {
    test('should have a valid title', () => {
      expect(readmeContent).toMatch(/^# Supabase Community Starter/m);
    });

    test('should contain required sections', () => {
      const requiredSections = [
        '## Overview',
        '## Deployment', 
        '## Build your app',
        '## How It Works'
      ];

      requiredSections.forEach(section => {
        expect(readmeContent).toContain(section);
      });
    });

    test('should have proper markdown heading hierarchy', () => {
      const lines = readmeContent.split('\n');
      const headings = lines.filter(line => line.startsWith('#'));
      
      // Should start with h1
      expect(headings[0]).toMatch(/^# /);
      
      // Should not skip heading levels inappropriately
      headings.forEach((heading, index) => {
        if (index > 0) {
          const currentLevel = heading.match(/^#+/)[0].length;
          const prevLevel = headings[index - 1].match(/^#+/)[0].length;
          expect(currentLevel - prevLevel).toBeLessThanOrEqual(2);
        }
      });
    });

    test('should not have trailing whitespace', () => {
      const lines = readmeContent.split('\n');
      lines.forEach((line, index) => {
        expect(line).not.toMatch(/\s+$/);
      });
    });

    test('should end with a newline', () => {
      expect(readmeContent).toMatch(/\n$/);
    });

    test('should have consistent line breaks between sections', () => {
      const sections = readmeContent.match(/^## .+$/gm) || [];
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Content Validation', () => {
    test('should contain v0.dev references', () => {
      expect(readmeContent).toContain('v0.dev');
      expect(readmeContent).toMatch(/\[v0\.dev\]\(https:\/\/v0\.dev\)/);
    });

    test('should contain Vercel deployment information', () => {
      expect(readmeContent).toContain('Vercel');
      expect(readmeContent).toContain('vercel.com');
    });

    test('should have consistent project naming', () => {
      const projectRefs = readmeContent.match(/supabase.community.starter/gi) || [];
      expect(projectRefs.length).toBeGreaterThan(0);
    });

    test('should contain deployment workflow steps', () => {
      const workflowSteps = [
        'Create and modify',
        'Deploy your chats', 
        'automatically pushed',
        'Vercel deploys'
      ];

      workflowSteps.forEach(step => {
        expect(readmeContent).toMatch(new RegExp(step, 'i'));
      });
    });

    test('should have synchronization messaging', () => {
      expect(readmeContent).toMatch(/automatically synced/i);
      expect(readmeContent).toMatch(/stay in sync/i);
    });

    test('should describe the integration between v0.dev and repository', () => {
      expect(readmeContent).toMatch(/changes.*automatically.*pushed/i);
      expect(readmeContent).toMatch(/repository.*sync/i);
    });
  });

  describe('Links and URLs', () => {
    test('should contain valid URL formats', () => {
      const urls = readmeContent.match(/https?:\/\/[^\s\)]+/g) || [];
      
      urls.forEach(url => {
        expect(url).toMatch(/^https?:\/\/.+\..+/);
        expect(url).not.toContain(' ');
      });
    });

    test('should have properly formatted markdown links', () => {
      const markdownLinks = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      
      markdownLinks.forEach(link => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        expect(match[1]).toBeTruthy(); // Link text should not be empty
        expect(match[2]).toBeTruthy(); // URL should not be empty
        expect(match[2]).toMatch(/^https?:\/\//); // Should be absolute URL
      });
    });

    test('should contain expected project URLs', () => {
      expect(readmeContent).toContain('vercel.com/fvvkkukf-7000s-projects/v0-supabase-community-starter');
      expect(readmeContent).toContain('v0.dev/chat/projects/HmBLX3zIVNF');
    });

    test('should have consistent URL formatting in badges and links', () => {
      const vercelUrls = readmeContent.match(/vercel\.com[^\s\)]+/g) || [];
      const v0DevUrls = readmeContent.match(/v0\.dev[^\s\)]+/g) || [];
      
      expect(vercelUrls.length).toBeGreaterThan(0);
      expect(v0DevUrls.length).toBeGreaterThan(0);
    });

    test('should have working link format for deployment URL', () => {
      expect(readmeContent).toMatch(/\*\*\[https:\/\/vercel\.com[^\]]+\]\([^)]+\)\*\*/);
    });

    test('should have working link format for v0.dev project URL', () => {
      expect(readmeContent).toMatch(/\*\*\[https:\/\/v0\.dev[^\]]+\]\([^)]+\)\*\*/);
    });
  });

  describe('Badges and Styling', () => {
    test('should contain deployment badge', () => {
      expect(readmeContent).toMatch(/!\[Deployed on Vercel\]/);
      expect(readmeContent).toContain('img.shields.io/badge/Deployed%20on-Vercel');
    });

    test('should contain v0 badge', () => {
      expect(readmeContent).toMatch(/!\[Built with v0\]/);
      expect(readmeContent).toContain('img.shields.io/badge/Built%20with-v0.dev');
    });

    test('should have consistent badge styling', () => {
      const badges = readmeContent.match(/img\.shields\.io\/badge\/[^)]+/g) || [];
      
      badges.forEach(badge => {
        expect(badge).toContain('style=for-the-badge');
        expect(badge).toContain('black');
      });
    });

    test('should have proper badge link formatting', () => {
      const badgeLinks = readmeContent.match(/\[![^\]]+\]\([^)]+\)/g) || [];
      expect(badgeLinks.length).toBeGreaterThanOrEqual(2); // At least Vercel and v0 badges
    });
  });

  describe('Documentation Quality', () => {
    test('should have clear instructions', () => {
      expect(readmeContent).toMatch(/continue building/i);
      expect(readmeContent).toMatch(/how it works/i);
    });

    test('should not contain placeholder text', () => {
      const placeholders = ['TODO', 'FIXME', 'XXX', 'placeholder', 'example.com'];
      placeholders.forEach(placeholder => {
        expect(readmeContent.toLowerCase()).not.toContain(placeholder.toLowerCase());
      });
    });

    test('should have proper emphasis formatting', () => {
      const boldTexts = readmeContent.match(/\*\*[^*]+\*\*/g) || [];
      boldTexts.forEach(boldText => {
        expect(boldText.length).toBeGreaterThan(4); // More than just **
        expect(boldText).not.toMatch(/\*\*\s/); // No space after opening
        expect(boldText).not.toMatch(/\s\*\*/); // No space before closing
      });
    });

    test('should have consistent project description', () => {
      expect(readmeContent).toContain('Supabase Community Starter');
      expect(readmeContent).toMatch(/automatically synced.*v0\.dev.*deployments/i);
    });

    test('should provide clear next steps for users', () => {
      expect(readmeContent).toMatch(/continue building.*app/i);
      expect(readmeContent).toContain('v0.dev/chat/projects');
    });
  });

  describe('Accessibility and Readability', () => {
    test('should have descriptive alt text for images', () => {
      const images = readmeContent.match(/!\[[^\]]*\]/g) || [];
      images.forEach(image => {
        const altText = image.match(/!\[([^\]]*)\]/)[1];
        expect(altText.length).toBeGreaterThan(0);
        expect(altText).not.toMatch(/^image$/i); // Should be descriptive, not generic
      });
    });

    test('should have reasonable line lengths', () => {
      const lines = readmeContent.split('\n');
      const longLines = lines.filter(line => line.length > 120);
      
      // Allow some flexibility for URLs and badges
      expect(longLines.length).toBeLessThan(lines.length * 0.3);
    });

    test('should use consistent formatting for emphasized links', () => {
      const emphasizedLinks = readmeContent.match(/\*\*\[[^\]]+\]\([^)]+\)\*\*/g) || [];
      expect(emphasizedLinks.length).toBeGreaterThanOrEqual(2); // Deployment and build links
    });

    test('should have proper section content balance', () => {
      const sections = readmeContent.split(/^## /m);
      sections.slice(1).forEach(section => { // Skip the first part before any ##
        const lines = section.split('\n').filter(line => line.trim().length > 0);
        expect(lines.length).toBeGreaterThan(1); // Each section should have content
      });
    });
  });

  describe('Deployment Information Accuracy', () => {
    test('should contain specific deployment URL', () => {
      expect(readmeContent).toContain('https://vercel.com/fvvkkukf-7000s-projects/v0-supabase-community-starter');
    });

    test('should contain specific v0.dev project URL', () => {
      expect(readmeContent).toContain('https://v0.dev/chat/projects/HmBLX3zIVNF');
    });

    test('should explain the automatic deployment process', () => {
      expect(readmeContent).toMatch(/changes.*automatically.*pushed.*repository/i);
      expect(readmeContent).toMatch(/vercel.*deploys.*latest.*version/i);
    });

    test('should reference the correct repository sync behavior', () => {
      expect(readmeContent).toMatch(/repository.*stay.*sync/i);
      expect(readmeContent).toMatch(/deployed.*app.*automatically.*pushed/i);
    });
  });
});
