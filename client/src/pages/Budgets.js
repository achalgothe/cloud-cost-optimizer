import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid } from '@mui/x-data-grid';
import { budgetService } from '../services';

const Budgets = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cloudProvider: 'all',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    alertsEnabled: true,
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetService.getAll();
      console.log('Budgets response:', response);
      setBudgets(Array.isArray(response) ? response : []);
    } catch (err) {
      setError('Failed to load budgets');
      console.error(err);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        name: budget.name,
        cloudProvider: budget.cloudProvider,
        amount: budget.amount,
        period: budget.period,
        startDate: budget.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        alertsEnabled: budget.alertsEnabled,
      });
    } else {
      setEditingBudget(null);
      setFormData({
        name: '',
        cloudProvider: 'all',
        amount: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        alertsEnabled: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBudget(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (editingBudget) {
        await budgetService.update(editingBudget._id, formData);
      } else {
        await budgetService.create(formData);
      }
      handleCloseDialog();
      await fetchBudgets();
    } catch (err) {
      setError('Failed to save budget');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetService.delete(id);
        await fetchBudgets();
      } catch (err) {
        setError('Failed to delete budget');
        console.error(err);
      }
    }
  };

  const getPeriodLabel = (period) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };
    return labels[period] || period;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      paused: 'default',
      exceeded: 'error',
      completed: 'info',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Budget Name',
      width: 200,
    },
    {
      field: 'cloudProvider',
      headerName: 'Provider',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value?.toUpperCase() || 'ALL'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'amount',
      headerName: 'Budget Amount',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="600">
          ${(parseFloat(params.value) || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'actualSpend',
      headerName: 'Actual Spend',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          ${(parseFloat(params.row.actualSpend) || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'percentageUsed',
      headerName: 'Usage',
      width: 150,
      renderCell: (params) => {
        const percentage = parseFloat(params.value) || 0;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, percentage)}
              sx={{
                flexGrow: 1,
                mr: 1,
                height: 8,
                borderRadius: 4,
                bgcolor: percentage >= 100 ? '#f44336' : '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: percentage >= 100 ? '#f44336' : '#1976d2',
                },
              }}
            />
            <Typography variant="body2" sx={{ minWidth: 45 }}>
              {percentage.toFixed(0)}%
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'period',
      headerName: 'Period',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">{getPeriodLabel(params.value)}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => handleOpenDialog(params.row)}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            size="small"
            onClick={() => handleDelete(params.row._id)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Budgets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Budget
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Budgets
              </Typography>
              <Typography variant="h4">{budgets?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Budgeted
              </Typography>
              <Typography variant="h5">
                ${(budgets || []).reduce((acc, b) => acc + (b.amount || 0), 0).toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Spent
              </Typography>
              <Typography variant="h5">
                ${(budgets || []).reduce((acc, b) => acc + (b.actualSpend || 0), 0).toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Exceeded Budgets
              </Typography>
              <Typography variant="h4" color="error.main">
                {(budgets || []).filter(b => b.status === 'exceeded').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budgets Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={budgets.map((b) => ({ ...b, id: b._id }))}
              columns={columns}
              autoHeight
              hideFooterPagination
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e0e0e0',
                },
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Budget Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                select
                label="Cloud Provider"
                value={formData.cloudProvider}
                onChange={(e) => setFormData({ ...formData, cloudProvider: e.target.value })}
                required
                sx={{ mb: 2 }}
              >
                <MenuItem value="all">All Providers</MenuItem>
                <MenuItem value="aws">AWS</MenuItem>
                <MenuItem value="azure">Azure</MenuItem>
                <MenuItem value="gcp">GCP</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Budget Amount (USD)"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                select
                label="Period"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                required
                sx={{ mb: 2 }}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingBudget ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Budgets;
