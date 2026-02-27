const Budget = require('../models/Budget');
const Cost = require('../models/Cost');

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    const { status, provider } = req.query;
    const user = req.user._id;

    const filter = { user };

    if (status) filter.status = status;
    if (provider) filter.cloudProvider = provider;

    const budgets = await Budget.find(filter).sort({ createdAt: -1 });

    // Enrich with current spend data
    const enrichedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const budgetObj = budget.toObject();
        
        // Calculate actual spend for this budget period
        const now = new Date();
        let startDate;
        
        switch (budget.period) {
          case 'daily':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'weekly':
            startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarterly':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const costFilter = {
          user: req.user._id,
          date: { $gte: startDate },
        };
        
        if (budget.cloudProvider !== 'all') {
          costFilter.cloudProvider = budget.cloudProvider;
        }

        const costData = await Cost.aggregate([
          { $match: costFilter },
          { $group: { _id: null, total: { $sum: '$cost' } } },
        ]);

        const actualSpend = costData[0]?.total || 0;
        const percentageUsed = budget.amount > 0 ? (actualSpend / budget.amount) * 100 : 0;

        // Update budget with actual spend
        await Budget.findByIdAndUpdate(budget._id, {
          actualSpend,
          status: percentageUsed >= 100 ? 'exceeded' : 'active',
        });

        return {
          ...budgetObj,
          actualSpend,
          percentageUsed: percentageUsed.toFixed(2),
        };
      })
    );

    res.json({
      success: true,
      data: enrichedBudgets,
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error fetching budgets' });
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
const getBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ message: 'Server error fetching budget' });
  }
};

// @desc    Create budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res) => {
  try {
    const budgetData = {
      ...req.body,
      user: req.user._id,
    };

    const budget = await Budget.create(budgetData);

    res.status(201).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Server error creating budget' });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;

    let budget = await Budget.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    budget = await Budget.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error updating budget' });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await budget.deleteOne();

    res.json({
      success: true,
      message: 'Budget deleted',
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error deleting budget' });
  }
};

module.exports = {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
};
