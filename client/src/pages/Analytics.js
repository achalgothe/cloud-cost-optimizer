import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [anomalyData, setAnomalyData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    fetchAnomalyData();
    fetchComparison();
    fetchForecast();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/overview', { params: { period } });
      setAnalytics(response.data.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnomalyData = async () => {
    try {
      const response = await axios.get('/api/anomaly/detect', { params: { period } });
      setAnomalyData(response.data.data);
    } catch (err) {
      console.error('Failed to load anomaly data:', err);
    }
  };

  const fetchComparison = async () => {
    try {
      const response = await axios.get('/api/analytics/compare', { 
        params: { currentPeriod: period, previousPeriod: period } 
      });
      setComparison(response.data.data);
    } catch (err) {
      console.error('Failed to load comparison:', err);
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await axios.get('/api/analytics/forecast', { 
        params: { days: 7, period } 
      });
      setForecast(response.data.data);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    }
  };

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod) setPeriod(newPeriod);
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUpIcon color="error" />;
    if (trend === 'decreasing') return <TrendingDownIcon color="success" />;
    return <RemoveIcon color="action" />;
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return <CheckCircleIcon color="success" />;
    if (score >= 50) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  if (loading && !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Cost Analytics & Anomaly Detection</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
            size="small"
          >
            <ToggleButton value={30}>30D</ToggleButton>
            <ToggleButton value={60}>60D</ToggleButton>
            <ToggleButton value={90}>90D</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalytics}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Health Score Card */}
      {anomalyData && (
        <Card sx={{ mb: 3, bgcolor: anomalyData.summary.overallHealth === 'good' ? '#e8f5e9' : anomalyData.summary.overallHealth === 'fair' ? '#fff3e0' : '#ffebee' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getHealthIcon(anomalyData.summary.healthScore)}
              <Box>
                <Typography variant="h6">
                  Cost Health Score: {anomalyData.summary.healthScore}/100
                </Typography>
                <Typography color="text.secondary">
                  Status: {anomalyData.summary.overallHealth.toUpperCase()} | 
                  Anomalies: {anomalyData.summary.totalAnomalies} | 
                  Spikes: {anomalyData.summary.totalSpikes}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Cost ({period} days)
              </Typography>
              <Typography variant="h4" color="primary.main">
                ${analytics?.totalCost?.toLocaleString() || '0'}
              </Typography>
              {comparison && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {getTrendIcon(comparison.change.direction)}
                  <Typography 
                    variant="body2" 
                    color={comparison.change.direction === 'increase' ? 'error.main' : comparison.change.direction === 'decrease' ? 'success.main' : 'text.secondary'}
                    sx={{ ml: 0.5 }}
                  >
                    {comparison.change.percentage > 0 ? '+' : ''}{comparison.change.percentage}%
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Average Daily Cost
              </Typography>
              <Typography variant="h5">
                ${analytics?.avgDailyCost?.toFixed(2) || '0'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                per day
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Anomalies Detected
              </Typography>
              <Typography variant="h4" color={anomalyData?.anomalyDetection?.totalAnomalies > 0 ? 'error.main' : 'success.main'}>
                {anomalyData?.anomalyDetection?.totalAnomalies || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {anomalyData?.anomalyDetection?.totalWarnings || 0} warnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Potential Savings
              </Typography>
              <Typography variant="h5" color="success.main">
                ${anomalyData?.optimizationOpportunities?.totalPotentialSavings?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                from optimizations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab icon={<AssessmentIcon />} label="Overview" iconPosition="start" />
          <Tab icon={<ShowChartIcon />} label="Trends" iconPosition="start" />
          <Tab icon={<WarningIcon />} label="Anomalies" iconPosition="start" />
          <Tab icon={<TrendingUpIcon />} label="Forecast" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Cost by Provider */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>Cost by Provider</Typography>
                {analytics?.costByProvider?.map((provider) => (
                  <Box key={provider._id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{provider.name}</Typography>
                      <Typography variant="body2" fontWeight="600">
                        ${provider.total.toLocaleString()} ({provider.percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={provider.percentage} 
                      color={provider._id === 'aws' ? 'warning' : provider._id === 'azure' ? 'info' : 'success'}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Cost by Service Type */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>Cost by Service Type</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics?.costByServiceType || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Services */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>Top Spending Services</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Provider</TableCell>
                        <TableCell align="right">Cost</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics?.topServices?.map((service, index) => (
                        <TableRow key={service._id}>
                          <TableCell>#{index + 1}</TableCell>
                          <TableCell>{service.name}</TableCell>
                          <TableCell>
                            <Chip label={service.provider.toUpperCase()} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">${service.total.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {((service.total / analytics.totalCost) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Trends Tab */}
      {activeTab === 1 && analytics && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>Daily Cost Trend with Moving Average</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analytics.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="total" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} name="Total Cost" />
                    <Area type="monotone" dataKey="aws" stroke="#ff9800" fill="#ff9800" fillOpacity={0.2} name="AWS" />
                    <Area type="monotone" dataKey="azure" stroke="#2196f3" fill="#2196f3" fillOpacity={0.2} name="Azure" />
                    <Area type="monotone" dataKey="gcp" stroke="#4caf50" fill="#4caf50" fillOpacity={0.2} name="GCP" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {anomalyData?.anomalyDetection?.movingAverages && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3 }}>Moving Average Analysis (7-day window)</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={anomalyData.anomalyDetection.movingAverages || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#1976d2" strokeWidth={2} name="Actual Cost" />
                      <Line type="monotone" dataKey="movingAverage" stroke="#4caf50" strokeWidth={2} strokeDasharray="5 5" name="7-Day Avg" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Anomalies Tab */}
      {activeTab === 2 && anomalyData && (
        <Grid container spacing={3}>
          {/* Anomalies */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: 'error.main' }}>
                  Detected Anomalies ({anomalyData.anomalyDetection.totalAnomalies})
                </Typography>
                {anomalyData.anomalyDetection.anomalies.length === 0 ? (
                  <Alert severity="success">No anomalies detected! Your costs are within normal range.</Alert>
                ) : (
                  <Box>
                    {anomalyData.anomalyDetection.anomalies.map((anomaly) => (
                      <Alert 
                        key={anomaly._id} 
                        severity="error" 
                        sx={{ mb: 2 }}
                        icon={<ErrorIcon />}
                      >
                        <Typography variant="body2" fontWeight="600">
                          {anomaly.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Actual: ${anomaly.actualCost} | Expected: ${anomaly.expectedCost} | 
                          Deviation: {anomaly.deviationPercent}%
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          💡 {anomaly.recommendation}
                        </Typography>
                      </Alert>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Warnings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: 'warning.main' }}>
                  Warnings ({anomalyData.anomalyDetection.totalWarnings})
                </Typography>
                {anomalyData.anomalyDetection.warnings.length === 0 ? (
                  <Alert severity="success">No warnings! Costs are stable.</Alert>
                ) : (
                  <Box>
                    {anomalyData.anomalyDetection.warnings.map((warning) => (
                      <Alert 
                        key={warning._id} 
                        severity="warning" 
                        sx={{ mb: 2 }}
                        icon={<WarningIcon />}
                      >
                        <Typography variant="body2" fontWeight="600">
                          {warning.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Actual: ${warning.actualCost} | Threshold: ${warning.threshold}
                        </Typography>
                      </Alert>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Optimization Opportunities */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: 'success.main' }}>
                  Optimization Opportunities (${anomalyData.optimizationOpportunities.totalPotentialSavings} potential savings)
                </Typography>
                <Grid container spacing={2}>
                  {anomalyData.optimizationOpportunities.opportunities.map((opp) => (
                    <Grid item xs={12} md={6} key={opp._id}>
                      <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="600">
                              {opp.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {opp.description}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip 
                                label={`Save $${opp.potentialSavings}`} 
                                size="small" 
                                color="success" 
                                variant="filled" 
                              />
                              <Chip 
                                label={`Confidence: ${(opp.confidence * 100).toFixed(0)}%`} 
                                size="small" 
                                sx={{ ml: 1 }} 
                              />
                              <Chip 
                                label={`Effort: ${opp.effort}`} 
                                size="small" 
                                variant="outlined" 
                                sx={{ ml: 1 }} 
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Forecast Tab */}
      {activeTab === 3 && forecast && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Cost Forecast (Next {forecast.period} Days)
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={forecast.forecast || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" stroke="#1976d2" strokeWidth={2} name="Predicted" />
                    <Line type="monotone" dataKey="upperBound" stroke="#4caf50" strokeDasharray="5 5" name="Upper Bound" />
                    <Line type="monotone" dataKey="lowerBound" stroke="#ff9800" strokeDasharray="5 5" name="Lower Bound" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>Forecast Summary</Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography color="text.secondary" variant="body2">Total Forecast</Typography>
                  <Typography variant="h4">${forecast.totalForecast?.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography color="text.secondary" variant="body2">Avg Daily Forecast</Typography>
                  <Typography variant="h5">${forecast.avgDailyForecast?.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography color="text.secondary" variant="body2">Trend</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    {getTrendIcon(forecast.trend)}
                    <Typography variant="body1" sx={{ ml: 0.5, textTransform: 'capitalize' }}>
                      {forecast.trend}
                    </Typography>
                  </Box>
                </Box>
                <Alert severity={forecast.trend === 'increasing' ? 'warning' : 'info'}>
                  {forecast.trend === 'increasing' 
                    ? 'Costs are trending upward. Consider optimization measures.'
                    : forecast.trend === 'decreasing'
                    ? 'Costs are trending downward. Good job!'
                    : 'Costs are stable.'}
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;
