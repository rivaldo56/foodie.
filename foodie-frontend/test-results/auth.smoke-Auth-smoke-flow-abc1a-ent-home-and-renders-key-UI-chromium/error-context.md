# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - heading "Sign in to Foodie" [level=1] [ref=e8]
        - paragraph [ref=e9]: Access client and chef experiences with a single account.
      - generic [ref=e10]:
        - generic [ref=e11]:
          - text: Email address
          - textbox "Email address" [ref=e12]: client@example.com
        - generic [ref=e13]:
          - text: Password
          - textbox "Password" [ref=e14]: password123
        - paragraph [ref=e15]: "Login failed: 400"
        - button "Sign in" [active] [ref=e16]
      - paragraph [ref=e17]:
        - text: No account yet?
        - link "Create one now" [ref=e18] [cursor=pointer]:
          - /url: /register
  - generic [ref=e23] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e24]:
      - img [ref=e25]
    - generic [ref=e28]:
      - button "Open issues overlay" [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]: "0"
          - generic [ref=e32]: "1"
        - generic [ref=e33]: Issue
      - button "Collapse issues badge" [ref=e34]:
        - img [ref=e35]
  - alert [ref=e37]
```