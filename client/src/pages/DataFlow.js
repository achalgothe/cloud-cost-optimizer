import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudIcon from '@mui/icons-material/Cloud';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SavingsIcon from '@mui/icons-material/Savings';
import axios from 'axios';

const DataFlow = () => {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle, processing, complete, error

  const steps = [
    {
      label: 'User Dashboard',
      icon: <DashboardIcon />,
      description: 'User initiates data refresh from dashboard',
    },
    {
      label: 'Backend API',
      icon: <CloudIcon />,
      description: 'API receives request and orchestrates data flow',
    },
    {
      label: 'AWS Data Fetch',
      icon: <CloudIcon />,
      description: 'Fetch cost and usage data from AWS APIs',
    },
    {
      label: 'Analytics Engine',
      icon: <AnalyticsIcon />,
      description: 'Process data and calculate trends, anomalies',
    },
    {
      label: 'AI Insights',
      icon: <PsychologyIcon />,
      description: 'Generate intelligent recommendations',
    },
    {
      label: 'UI Visualization',
      icon: <DashboardIcon />,
      description: 'Display insights and recommendations to user',
    },
  ];

  const handleProcessData = async () => {
    try {
      setLoading(true);
      setError('');
      setStatus('processing');
      setActiveStep(0);

      // Simulate the flow with timing
      const stepTimings = [500, 1000, 1500, 2000, 2500, 3000];
      
      for (let i = 0; i < stepTimings.length; i++) {
        await new Promise(resolve => setTimeout(resolve, stepTimings[i] - (i > 0 ? stepTimings[i-1] : 0)));
        setActiveStep(i + 1);
      }

      // Fetch actual data
      const response = await axios.get('/api/data/insights');
      setData(response.data.data);
      setStatus('complete');
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing data');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportAWS = async () => {
    // In production, would show a dialog for AWS credentials
    try {
      setLoading(true);
      setError('');
      setStatus('processing');
      
      // Mock AWS import
      await new Promise(resolve => setTimeout(resolve, 2000));
      setActiveStep(3);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setActiveStep(6);
      
      const response = await axios.get('/api/data/insights');
      setData(response.data.data);
      setStatus('complete');
    } catch (err) {
      setError('AWS import failed');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Data Flow Pipeline</Typography>
        <Box>
          <Tooltip title="Import data from AWS">
            <Button
              variant="outlined"
              startIcon={<CloudIcon />}
              onClick={handleImportAWS}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Import AWS Data
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={loading ? <RefreshIcon className="spin" /> : <RefreshIcon />}
            onClick={handleProcessData}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Run Data Flow'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {status === 'processing' && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Processing data through pipeline... Step {activeStep} of {steps.length}
          </Typography>
        </Box>
      )}

      {/* Pipeline Visualization */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Data Flow Pipeline
          </Typography>
          
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: index < activeStep ? 'success.main' : 
                                 index === activeStep ? 'primary.main' : 'grey.300',
                        color: index <= activeStep ? 'white' : 'grey.500',
                      }}
                    >
                      {index < activeStep ? <CheckCircleIcon /> : step.icon}
                    </Box>
                  )}
                >
                  <Typography variant="body1" fontWeight="500">
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                  {index === activeStep && loading && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress size={20} />
                    </Box>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Results */}
      {status === 'complete' && data && (
        <Grid container spacing={3}>
          {/* Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  AI-Generated Summary
                </Typography>
                <Alert severity="info">
                  {data.insights?.naturalLanguageSummary || 'No summary available'}
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Cost Summary */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography color="text.secondary">Total Cost</Typography>
                </Box>
                <Typography variant="h4">
                  ${data.costs?.total?.toFixed(2) || '0.00'}
                </Typography>
                <Chip
                  label={data.insights?.summary?.trend || 'stable'}
                  size="small"
                  sx={{ mt: 1 }}
                  color={data.insights?.summary?.trend === 'increasing' ? 'error' : 
                       data.insights?.summary?.trend === 'decreasing' ? 'success' : 'default'}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Savings Potential */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SavingsIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography color="text.secondary">Potential Savings</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  ${data.recommendations?.savingsPotential?.total?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From {data.recommendations?.total || 0} recommendations
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Anomalies */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AnalyticsIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography color="text.secondary">Anomalies Detected</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {data.insights?.anomalies?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cost spikes requiring attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Recommendations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Top AI Recommendations
                </Typography>
                {data.recommendations?.items?.slice(0, 3).map((rec, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip
                            label={rec.priority}
                            size="small"
                            color={rec.priority === 'high' ? 'error' : 
                                   rec.priority === 'medium' ? 'warning' : 'info'}
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={rec.category}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Confidence: {rec.aiConfidence?.toFixed(0)}%
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="500">
                          {rec.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {rec.description}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="success.main">
                          ${rec.estimatedSavings?.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          savings
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Status: Idle */}
      {status === 'idle' && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: 'background.default',
            borderRadius: 2,
          }}
        >
          <CloudIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Click "Run Data Flow" to process cloud data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Data will flow through: Dashboard → API → AWS → Analytics → AI → UI
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DataFlow;
