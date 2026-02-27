const axios = require('axios');

class AlertService {
  /**
   * Send email alert
   */
  static async sendEmailAlert(options) {
    const { to, subject, message, type = 'info' } = options;

    console.log(`📧 Sending email alert to ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Type: ${type}`);

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, log the alert
    const alert = {
      type: 'email',
      to,
      subject,
      message,
      severity: type,
      timestamp: new Date().toISOString(),
    };

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // await axios.post('https://api.sendgrid.com/v3/mail/send', {
    //   personalizations: [{ to: [{ email: to }] }],
    //   from: { email: 'alerts@cloudoptimizer.com', name: 'Cloud Cost Optimizer' },
    //   subject,
    //   content: [{ type: 'text/plain', value: message }],
    // }, {
    //   headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` }
    // });

    console.log('   ✓ Email alert logged (configure email service in production)');
    return alert;
  }

  /**
   * Send Slack alert
   */
  static async sendSlackAlert(options) {
    const { webhookUrl, message, type = 'info' } = options;

    console.log(`💬 Sending Slack alert to webhook`);

    const colors = {
      info: '#36a64f',
      warning: '#ff9800',
      error: '#f44336',
      success: '#4caf50',
    };

    const icons = {
      info: ':information_source:',
      warning: ':warning:',
      error: ':x:',
      success: ':white_check_mark:',
    };

    const payload = {
      attachments: [
        {
          color: colors[type] || colors.info,
          author_name: 'Cloud Cost Optimizer',
          title: `${icons[type]} Cloud Cost Alert`,
          text: message,
          footer: 'Cloud Cost Optimizer',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    // Send to Slack webhook
    if (webhookUrl || process.env.SLACK_WEBHOOK_URL) {
      try {
        await axios.post(webhookUrl || process.env.SLACK_WEBHOOK_URL, payload);
        console.log('   ✓ Slack alert sent');
      } catch (error) {
        console.error('   ✗ Failed to send Slack alert:', error.message);
      }
    } else {
      console.log('   ⚠ Slack webhook not configured');
      console.log('   Message:', message);
    }

    return {
      type: 'slack',
      webhookUrl: webhookUrl || process.env.SLACK_WEBHOOK_URL,
      message,
      severity: type,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send budget threshold alert
   */
  static async sendBudgetAlert(options) {
    const {
      budgetName,
      budgetAmount,
      currentSpend,
      percentageUsed,
      threshold,
      recipients,
      cloudProvider,
    } = options;

    const subject = `🚨 Budget Alert: ${budgetName} - ${percentageUsed.toFixed(1)}% Used`;
    
    const message = `
*Budget Alert Notification*

*Budget:* ${budgetName}
*Cloud Provider:* ${cloudProvider?.toUpperCase() || 'All'}
*Budget Amount:* $${budgetAmount.toFixed(2)}
*Current Spend:* $${currentSpend.toFixed(2)}
*Usage:* ${percentageUsed.toFixed(1)}%
*Threshold:* ${threshold}%

⚠️ Your cloud spending has crossed the ${threshold}% threshold!

*Recommended Actions:*
• Review recent resource deployments
• Check for unused or idle resources
• Consider rightsizing underutilized instances
• Review the Recommendations tab for optimization opportunities

_This is an automated alert from Cloud Cost Optimizer_
    `.trim();

    const alerts = [];

    // Send email alerts
    if (recipients && recipients.length > 0) {
      for (const email of recipients) {
        const alert = await this.sendEmailAlert({
          to: email,
          subject,
          message,
          type: percentageUsed >= 100 ? 'error' : 'warning',
        });
        alerts.push(alert);
      }
    }

    // Send Slack alert
    const slackAlert = await this.sendSlackAlert({
      message,
      type: percentageUsed >= 100 ? 'error' : 'warning',
    });
    alerts.push(slackAlert);

    return alerts;
  }

  /**
   * Send sudden cost spike alert
   */
  static async sendSpikeAlert(options) {
    const {
      cloudProvider,
      serviceName,
      currentCost,
      averageCost,
      spikePercentage,
      recipients,
    } = options;

    const subject = `🔥 Cost Spike Detected: ${serviceName} (${cloudProvider?.toUpperCase()})`;
    
    const message = `
*Cost Spike Alert*

*Sudden increase in cloud costs detected!*

*Service:* ${serviceName}
*Cloud Provider:* ${cloudProvider?.toUpperCase() || 'All'}
*Current Cost:* $${currentCost.toFixed(2)}
*Average Cost:* $${averageCost.toFixed(2)}
*Increase:* ${spikePercentage.toFixed(1)}% ⬆️

⚠️ This represents a significant cost increase compared to the average!

*Possible Causes:*
• New resources deployed
• Traffic spike
• Misconfigured auto-scaling
• Runaway processes
• Data transfer charges

*Recommended Actions:*
• Investigate recent changes to this service
• Check CloudWatch/Monitoring metrics
• Review resource utilization
• Verify no unintended deployments

_This is an automated alert from Cloud Cost Optimizer_
    `.trim();

    const alerts = [];

    // Send email alerts
    if (recipients && recipients.length > 0) {
      for (const email of recipients) {
        const alert = await this.sendEmailAlert({
          to: email,
          subject,
          message,
          type: 'error',
        });
        alerts.push(alert);
      }
    }

    // Send Slack alert
    const slackAlert = await this.sendSlackAlert({
      message,
      type: 'error',
    });
    alerts.push(slackAlert);

    return alerts;
  }

  /**
   * Send daily/weekly summary
   */
  static async sendSummaryAlert(options) {
    const {
      period,
      totalSpend,
      budgetAmount,
      topServices,
      recommendations,
      recipients,
    } = options;

    const subject = `📊 Cloud Cost Summary - ${period}`;
    
    const topServicesText = topServices
      .slice(0, 5)
      .map((s, i) => `${i + 1}. ${s.name}: $${s.cost.toFixed(2)}`)
      .join('\n');

    const message = `
*Cloud Cost Summary - ${period}*

*Total Spend:* $${totalSpend.toFixed(2)}
*Budget:* $${budgetAmount.toFixed(2)}
*Remaining:* $${(budgetAmount - totalSpend).toFixed(2)}
*Usage:* ${((totalSpend / budgetAmount) * 100).toFixed(1)}%

*Top Spending Services:*
${topServicesText}

*Active Recommendations:* ${recommendations}

_View your dashboard for detailed insights and optimization opportunities._

_This is an automated summary from Cloud Cost Optimizer_
    `.trim();

    const alerts = [];

    if (recipients && recipients.length > 0) {
      for (const email of recipients) {
        const alert = await this.sendEmailAlert({
          to: email,
          subject,
          message,
          type: 'info',
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }
}

module.exports = AlertService;
