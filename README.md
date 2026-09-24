# Replay2Proof demo

This prototype demonstrates:

Jira Cloud issue -> GitHub commit/PR -> GitHub Pages deployment -> Playwright browser replay -> video/trace/evidence -> Jira comment and attachments.

## Demo scenario

The first version intentionally contains a bug: clicking Export does not display `Download started`.
The fix branch changes the click handler to display that message.

## Required GitHub Actions secrets

- `JIRA_EMAIL`: the Atlassian account email used for Jira Cloud
- `JIRA_API_TOKEN`: an Atlassian API token

Never commit either value.
