const Inventory = require('../models/Inventory');

exports.getInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find({}).populate('station', 'name status');
    
    // Add dynamic isLowStock flag
    const formatted = inventories.map(inv => {
      const doc = inv.toObject();
      doc.isLowStock = doc.currentStock < doc.threshold;
      return doc;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { amountToAdd, newThreshold } = req.body;
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (amountToAdd !== undefined && amountToAdd !== '') {
      const num = Number(amountToAdd);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }
      inventory.currentStock += num;
      inventory.lastRefillAt = Date.now();
    }
    
    if (newThreshold !== undefined && newThreshold !== '') {
      const num = Number(newThreshold);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({ message: 'Threshold must be a positive number' });
      }
      inventory.threshold = num;
    }

    const updated = await inventory.save();
    
    const doc = updated.toObject();
    doc.isLowStock = doc.currentStock < doc.threshold;

    // Emit socket event
    req.io.emit('inventoryUpdated', { stationId: inventory.station, currentStock: inventory.currentStock });

    res.json(doc);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
};
