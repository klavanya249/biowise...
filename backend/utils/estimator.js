const FEEDSTOCK_YIELD = {
  cattle_dung: 0.035,
  food_waste: 0.090,
  agri_residue: 0.055,
  mixed: 0.060
};

// Educational rule-based estimate, not a validated scientific model.
function estimate(input) {
  const base = input.feedstockQuantityKg * FEEDSTOCK_YIELD[input.feedstockType];
  let factor = 1;
  const recommendations = [];

  // Broad illustrative operating bands for a prototype demonstration.
  if (input.ph < 6.5) { factor *= 0.78; recommendations.push("pH is below the illustrative operating band. Check alkalinity and acid accumulation before changing feed rate."); }
  else if (input.ph > 8.0) { factor *= 0.85; recommendations.push("pH is above the illustrative operating band. Verify the measurement and investigate possible ammonia-related inhibition."); }

  if (input.temperatureC < 30) { factor *= 0.82; recommendations.push("Temperature is relatively low for the selected demonstration model. Check heating consistency and daily temperature variation."); }
  else if (input.temperatureC > 40) { factor *= 0.80; recommendations.push("Temperature is high in this demonstration model. Verify the sensor and avoid sudden temperature changes."); }

  if (input.organicLoad > 4) { factor *= 0.82; recommendations.push("Organic loading is high for this prototype's warning rule. Review feed quantity and loading gradually."); }
  else if (input.organicLoad > 0 && input.organicLoad < 0.5) { factor *= 0.92; recommendations.push("Organic loading is low in this prototype's rule set. Check whether the entered loading value and digester volume are correct."); }

  if (input.moisturePercent < 70) { factor *= 0.88; recommendations.push("Moisture content is low in this demonstration model. Review slurry dilution and mixing."); }
  else if (input.moisturePercent > 95) { factor *= 0.95; recommendations.push("Moisture content is very high. Confirm the feedstock solids content and avoid excessive dilution."); }

  if (input.retentionDays < 15) { factor *= 0.85; recommendations.push("Retention time is short in this model. Review digester sizing and hydraulic retention time."); }

  const estimated = Math.max(0, base * factor);
  const critical = input.ph < 5.8 || input.ph > 8.5 || input.temperatureC < 20 || input.temperatureC > 45;
  const status = critical ? "Critical" : recommendations.length ? "Warning" : "Normal";
  if (!recommendations.length) recommendations.push("No warning rules were triggered. Continue routine measurement and compare estimates with actual gas-meter readings.");
  return {
    basePotentialM3Day: Number(base.toFixed(3)),
    conditionFactor: Number(factor.toFixed(3)),
    estimatedGasM3Day: Number(estimated.toFixed(3)),
    status,
    recommendations
  };
}

module.exports = { estimate };
