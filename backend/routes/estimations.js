const express = require("express");
const supabase = require("../supabase");
const { estimate } = require("../utils/estimator");
const router = express.Router();

const FEEDSTOCKS = ["cattle_dung", "food_waste", "agri_residue", "mixed"];
function validate(body) {
  const errors = [];
  const required = ["feedstockQuantityKg","moisturePercent","retentionDays","temperatureC","ph","organicLoad"];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === "" || !Number.isFinite(Number(body[key]))) errors.push(`${key} must be a valid number.`);
  }
  if (!FEEDSTOCKS.includes(body.feedstockType)) errors.push("Select a valid feedstock type.");
  const ranges = [
    ["feedstockQuantityKg",0.1,100000],["moisturePercent",0,100],["retentionDays",1,180],
    ["temperatureC",0,100],["ph",0,14],["organicLoad",0,20]
  ];
  for (const [key,min,max] of ranges) {
    const n = Number(body[key]);
    if (Number.isFinite(n) && (n < min || n > max)) errors.push(`${key} must be between ${min} and ${max}.`);
  }
  if (body.gasPressureKpa !== undefined && body.gasPressureKpa !== null && body.gasPressureKpa !== "" &&
      (!Number.isFinite(Number(body.gasPressureKpa)) || Number(body.gasPressureKpa) < 0 || Number(body.gasPressureKpa) > 1000)) {
    errors.push("gasPressureKpa must be between 0 and 1000.");
  }
  return errors;
}

router.get("/", async (_req,res,next) => {
  try {
    const { data,error } = await supabase.from("estimations").select("*").order("created_at",{ascending:false}).limit(100);
    if (error) throw error;
    res.json({records:data});
  } catch (error) { next(error); }
});

router.post("/", async (req,res,next) => {
  try {
    const errors = validate(req.body || {});
    if (errors.length) return res.status(400).json({error:errors.join(" ")});
    const input = {
      feedstockType:req.body.feedstockType,
      feedstockQuantityKg:Number(req.body.feedstockQuantityKg),
      moisturePercent:Number(req.body.moisturePercent),
      retentionDays:Number(req.body.retentionDays),
      temperatureC:Number(req.body.temperatureC),
      ph:Number(req.body.ph),
      organicLoad:Number(req.body.organicLoad),
      gasPressureKpa:req.body.gasPressureKpa === "" || req.body.gasPressureKpa == null ? null : Number(req.body.gasPressureKpa)
    };
    const result = estimate(input);
    const row = {
      feedstock_type:input.feedstockType, feedstock_quantity_kg:input.feedstockQuantityKg,
      moisture_percent:input.moisturePercent, retention_days:input.retentionDays,
      temperature_c:input.temperatureC, ph:input.ph, organic_load:input.organicLoad,
      gas_pressure_kpa:input.gasPressureKpa, base_potential_m3_day:result.basePotentialM3Day,
      condition_factor:result.conditionFactor, estimated_gas_m3_day:result.estimatedGasM3Day,
      status:result.status, recommendations:result.recommendations
    };
    const { data,error } = await supabase.from("estimations").insert(row).select("*").single();
    if (error) throw error;
    res.status(201).json({estimation:data});
  } catch (error) { next(error); }
});

router.delete("/:id", async (req,res,next) => {
  try {
    const { data,error } = await supabase.from("estimations").delete().eq("id",req.params.id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({error:"Estimation not found."});
    res.json({message:"Estimation deleted.",id:data.id});
  } catch (error) { next(error); }
});

module.exports = router;
