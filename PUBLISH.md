# Publishing to NPM - Step by Step Guide

## ✅ Pre-Publishing Checklist

- [x] Package builds successfully
- [x] No TypeScript errors
- [x] package.json configured
- [x] Binary configured for npx
- [x] README.md written
- [x] LICENSE file included

## 📦 Publishing Steps

### Step 1: Verify NPM Account

Make sure you have an NPM account:
- Go to https://www.npmjs.com/signup if you don't have one
- Verify your email address

### Step 2: Login to NPM

```bash
npm login
```

You'll be prompted for:
- Username
- Password
- Email
- One-time password (if 2FA is enabled)

### Step 3: Check Package Name Availability

Since we're using a scoped package `@manimaun/knowledge-mgmt-mcp`, it should be available.

You can verify:
```bash
npm view @manimaun/knowledge-mgmt-mcp
```

If it doesn't exist, you're good to go!

### Step 4: Publish the Package

```bash
npm publish --access public
```

**Note**: The `--access public` flag is required for scoped packages to be publicly accessible.

### Step 5: Verify Publication

After publishing, verify it worked:

```bash
# Check on NPM
npm view @manimaun/knowledge-mgmt-mcp

# Test installation
npx @manimaun/knowledge-mgmt-mcp --help
```

### Step 6: Test with Claude Desktop

Update your Claude Desktop config to use the published package:

```json
{
  "mcpServers": {
    "knowledge": {
      "command": "npx",
      "args": ["-y", "@manimaun/knowledge-mgmt-mcp"],
      "env": {
        "STORAGE_DIR": "/Users/yourname/Documents/knowledge-storage",
        "CHROMA_DB_DIR": "/Users/yourname/Documents/knowledge-chroma",
        "EMBEDDING_PROVIDER": "transformers",
        "EMBEDDING_MODEL": "Xenova/all-MiniLM-L6-v2"
      }
    }
  }
}
```

Restart Claude Desktop and test!

## 🔄 Publishing Updates

When you make changes and want to publish a new version:

### Patch Version (1.0.0 → 1.0.1)
For bug fixes:
```bash
npm version patch
npm publish --access public
```

### Minor Version (1.0.0 → 1.1.0)
For new features (backward compatible):
```bash
npm version minor
npm publish --access public
```

### Major Version (1.0.0 → 2.0.0)
For breaking changes:
```bash
npm version major
npm publish --access public
```

## 🎯 After Publishing

1. **Announce it!**
   - Share on Twitter/X
   - Post on Reddit (r/ClaudeAI, r/programming)
   - Share in MCP community

2. **Create GitHub Release**
   - Tag the version
   - Write release notes
   - Link to NPM package

3. **Update Documentation**
   - Add badges to README
   - Update examples with published package name
   - Add changelog

4. **Monitor**
   - Check NPM download stats
   - Watch for issues
   - Respond to feedback

## 📊 NPM Package Stats

Once published, you can view your package at:
https://www.npmjs.com/package/@manimaun/knowledge-mgmt-mcp

## 🔧 Troubleshooting

### "You do not have permission to publish"
- Make sure you're logged in: `npm whoami`
- Check package name doesn't conflict
- Use `--access public` for scoped packages

### "Package name already exists"
- Change the package name in package.json
- Use a scoped package: `@yourname/package-name`

### "version already published"
- Bump the version: `npm version patch`
- Then publish again

### "Need to provide OTP"
- You have 2FA enabled
- Enter the code from your authenticator app

## 🎉 Success!

Once published, anyone can use your package with:
```bash
npx @manimaun/knowledge-mgmt-mcp
```

Or install it globally:
```bash
npm install -g @manimaun/knowledge-mgmt-mcp
knowledge-mgmt-mcp
```

## 📝 Package Information

- **Package Name**: `@manimaun/knowledge-mgmt-mcp`
- **Version**: `1.0.0`
- **Size**: ~40 KB (gzipped)
- **Files**: 115 files
- **Node**: >=18.0.0
- **License**: MIT

## 🚀 Ready to Publish?

Run this command when ready:
```bash
npm publish --access public
```

Good luck! 🎊

