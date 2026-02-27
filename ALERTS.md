# Alerts & Notifications System

## Overview

The Cloud Cost Optimizer includes a comprehensive alerting system that automatically notifies you when:

1. **Budget thresholds are crossed** (e.g., 50%, 80%, 100% of budget)
2. **Sudden cost spikes are detected** (e.g., 50% increase vs previous period)
3. **Daily/Weekly summaries** are sent

## Features

### 📧 Email Alerts
- Send budget threshold notifications
- Cost spike warnings
- Scheduled summaries

### 💬 Slack Integration
- Real-time alerts in Slack channels
- Rich formatting with colors and icons
- Webhook-based integration

### 🔔 Automatic Monitoring
- **Budget checks**: Every hour
- **Spike detection**: Every 30 minutes
- **Daily summary**: At 9:00 AM every day

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Slack webhook URL (get from Slack app settings)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# SendGrid API key for email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx

# Alert sender email
ALERT_FROM_EMAIL=alerts@yourcompany.com

# Default alert recipients (comma-separated)
ALERT_RECIPIENTS=admin@yourcompany.com,finance@yourcompany.com
```

### Slack Setup

1. Go to your Slack workspace
2. Create a new incoming webhook:
   - Visit: https://your-workspace.slack.com/apps/manage/custom-integrations
   - Search for "Incoming Webhooks"
   - Add to a channel (e.g., #cloud-costs)
   - Copy the webhook URL
3. Add to `.env`:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

### Email Setup (SendGrid)

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key
3. Verify your sender email
4. Add to `.env`:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   ALERT_FROM_EMAIL=alerts@yourcompany.com
   ```

## Usage

### Via UI

1. Navigate to **Alerts** page
2. Configure settings:
   - Enable/disable email alerts
   - Enable/disable Slack alerts
   - Set budget thresholds (e.g., 50, 80, 100)
   - Set spike detection threshold (e.g., 50%)
   - Enable daily/weekly summaries
3. Click **Save**
4. Use **Test Email** or **Test Slack** to verify

### Via API

```bash
# Run budget threshold check
curl -X POST http://localhost:5000/api/alerts/check-budgets \
  -H "Authorization: Bearer YOUR_TOKEN"

# Run spike detection
curl -X POST http://localhost:5000/api/alerts/detect-spikes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Run all monitoring
curl -X POST http://localhost:5000/api/alerts/monitor \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send test alert
curl -X POST http://localhost:5000/api/alerts/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "email"}'

# Get alert history
curl http://localhost:5000/api/alerts/history \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get settings
curl http://localhost:5000/api/alerts/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update settings
curl -X PUT http://localhost:5000/api/alerts/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailAlerts": true,
    "slackAlerts": true,
    "budgetThresholds": [50, 80, 100],
    "spikeThreshold": 50
  }'
```

## Alert Types

### 1. Budget Threshold Alert

Triggered when spending crosses configured thresholds.

**Example:**
```
🚨 Budget Alert: Monthly AWS Budget - 85% Used

Budget: Monthly AWS Budget
Cloud Provider: AWS
Budget Amount: $5,000.00
Current Spend: $4,250.00
Usage: 85.0%
Threshold: 80%

⚠️ Your cloud spending has crossed the 80% threshold!
```

### 2. Cost Spike Alert

Triggered when costs increase significantly compared to previous period.

**Example:**
```
🔥 Cost Spike Detected: EC2 (AWS)

Service: EC2
Cloud Provider: AWS
Current Cost: $350.00
Average Cost: $200.00
Increase: 75.0% ⬆️

⚠️ This represents a significant cost increase!
```

### 3. Daily Summary

Sent every day at 9:00 AM with previous day's summary.

**Example:**
```
📊 Cloud Cost Summary - Daily

Total Spend: $156.50
Budget: $166.67
Remaining: $10.17
Usage: 93.9%

Top Spending Services:
1. EC2: $85.20
2. S3: $32.15
3. RDS: $25.50
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/alerts/check-budgets` | Check budget thresholds |
| POST | `/api/alerts/detect-spikes` | Detect cost spikes |
| POST | `/api/alerts/monitor` | Run all monitoring |
| POST | `/api/alerts/test` | Send test alert |
| GET | `/api/alerts/history` | Get alert history |
| GET | `/api/alerts/settings` | Get alert settings |
| PUT | `/api/alerts/settings` | Update alert settings |

## Best Practices

1. **Set multiple thresholds**: Configure 50%, 80%, and 100% for progressive warnings
2. **Use both channels**: Enable both email and Slack for critical alerts
3. **Review daily summaries**: Enable daily summaries to stay informed
4. **Test regularly**: Use test alerts to verify configuration
5. **Update recipients**: Keep alert recipients up to date

## Troubleshooting

### Alerts not being sent

1. Check environment variables are set correctly
2. Verify Slack webhook URL is valid
3. Check SendGrid API key has proper permissions
4. Review server logs for errors

### Too many alerts

1. Increase spike threshold percentage
2. Reduce number of budget thresholds
3. Disable non-critical notifications

### Slack alerts not working

1. Verify webhook URL is correct
2. Check the Slack channel still exists
3. Ensure webhook has permission to post

## Production Deployment

For production use:

1. **Use environment-specific webhooks**: Different Slack channels for prod/staging
2. **Set up escalation**: Configure different recipients for different severity levels
3. **Enable logging**: Store all alerts for audit purposes
4. **Monitor the monitor**: Set up health checks for the alerting system
5. **Rate limiting**: Prevent alert fatigue with cooldown periods

## Customization

You can customize alert messages in `server/services/alertService.js`:

```javascript
// Modify the message template
const message = `
*Custom Alert Title*

Your custom message format here...
`;
```

## Support

For issues or feature requests, please check the documentation or contact support.
