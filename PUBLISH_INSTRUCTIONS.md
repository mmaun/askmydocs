# How to Publish v1.0.1 with 2FA

## Step 1: Get Your 2FA Code

Open your authenticator app (Google Authenticator, Authy, etc.) and find the code for **NPM**.

It will be a **6-digit code** that changes every 30 seconds.

## Step 2: Run the Publish Command

```bash
cd /Users/manimaun/Documents/code/AskMyDocs
npm publish --otp=YOUR_6_DIGIT_CODE
```

**Replace `YOUR_6_DIGIT_CODE` with the actual code from your authenticator.**

### Example:

If your authenticator shows: `123456`

Then run:
```bash
npm publish --otp=123456
```

## ⚠️ Important Notes

1. **The code expires in 30 seconds** - type it quickly!
2. **No spaces** in the code
3. **Must be exactly 6 digits**
4. If it says "invalid OTP", get a fresh code and try again

## ✅ Success Looks Like

When it works, you'll see:
```
+ knowledge-mgmt-mcp@1.0.1
```

## 🎉 After Publishing

The fixed version will be available to everyone via:
```bash
npx knowledge-mgmt-mcp
```

You can then switch your Claude Desktop config back to using NPM instead of local:
```json
{
  "command": "npx",
  "args": ["-y", "knowledge-mgmt-mcp"]
}
```

