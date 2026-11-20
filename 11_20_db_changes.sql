/*
 * RoadReady - Maintenance Guide database setup
 *
 * Target: MariaDB 10.4+ / MySQL
 *
 * This script:
 *   1. Adds the four maintenance types introduced for the expanded guide
 *      (if they do not already exist).
 *   2. Creates maintenance_guide_articles if it does not already exist.
 *   3. Inserts or updates all 12 guide articles by maintenance type name.
 *
 * It expects the existing RoadReady maintenance_types table with:
 *   id, name, default_interval_miles, default_interval_months, created_at
 *
 * Run this against the RoadReady database.
 */

SET NAMES utf8mb4;
START TRANSACTION;

/* Add the four maintenance types introduced for the expanded guide.
   INSERT IGNORE prevents duplicate-name errors if they already exist. */
INSERT IGNORE INTO maintenance_types
    (name, default_interval_miles, default_interval_months)
VALUES
    ('Brake Fluid Service', NULL, 24),
    ('Suspension and Steering Inspection', 15000, 12),
    ('Tire Pressure and Condition', NULL, 1),
    ('Belts and Hoses Inspection', 30000, 24);

/* Create the guide article table. */
CREATE TABLE IF NOT EXISTS maintenance_guide_articles (
    id INT(11) NOT NULL AUTO_INCREMENT,
    maintenance_type_id INT(11) NOT NULL,
    title VARCHAR(150) NOT NULL,
    summary VARCHAR(300) DEFAULT NULL,
    body_markdown TEXT NOT NULL,
    risks_if_skipped TEXT DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY maintenance_type_id (maintenance_type_id),
    CONSTRAINT fk_guide_type
        FOREIGN KEY (maintenance_type_id)
        REFERENCES maintenance_types (id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

/*
 * Upsert all 12 articles. The maintenance type is looked up by its name,
 * rather than assuming auto-increment IDs are identical on every install.
 */

/* 1. Oil Change */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Engine Oil and Filter Change',
    'Learn why engine oil and its filter need regular replacement to protect the engine and maintain reliable lubrication.',
    '## Why engine oil matters

Engine oil lubricates moving parts, helps carry heat away from internal components, and suspends dirt and combustion by-products so the oil filter can capture them.

## What the service includes

- Drain the old engine oil.
- Replace the oil filter with the correct part.
- Install the manufacturer-recommended oil type and viscosity.
- Check the oil level and inspect for leaks.
- Reset the maintenance reminder when applicable.

## When to schedule it

Follow the interval in the owner''s manual. The correct interval depends on the vehicle, engine, oil specification, driving conditions, and oil-life monitoring system. Severe conditions such as frequent short trips, towing, dusty roads, or extreme temperatures may require more frequent service.

## Helpful owner checks

Check the dipstick or electronic oil-level display as directed by the owner''s manual. If the oil-pressure warning light comes on, stop safely and follow the manual''s instructions; do not continue driving with an oil-pressure warning.',
    'Skipping oil changes can allow oil to become contaminated or break down. This increases friction and wear, can contribute to sludge buildup, and may lead to overheating or severe engine damage. Low oil level or oil-pressure problems can cause damage very quickly.'
FROM maintenance_types mt
WHERE mt.name = 'Oil Change'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 2. Tire Rotation */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Tire Rotation and Wear Inspection',
    'Understand how rotating tires helps promote even tread wear, extend tire life, and reveal developing tire problems.',
    '## Why tire rotation matters

Tires can wear at different rates depending on whether a vehicle is front-wheel drive, rear-wheel drive, or all-wheel drive. Steering, braking, weight distribution, and driving habits also affect wear.

## What the service includes

- Move each tire to the position specified by the vehicle and tire manufacturer.
- Inspect tread depth and look for uneven wear.
- Check for cuts, bulges, punctures, and other visible damage.
- Set tire pressures to the vehicle manufacturer''s recommended cold pressures.
- Confirm wheel fasteners are tightened to the specified torque.

## Rotation patterns

The correct pattern depends on tire type and drivetrain. Directional tires, staggered wheel setups, and some performance tires may have restrictions. Always use the pattern specified for the vehicle and tires.

## When to schedule it

Use the interval in the owner''s manual or tire manufacturer''s guidance. Rotate sooner if uneven wear is developing, after confirming the tires are suitable for rotation.',
    'Skipping rotations can cause uneven tread wear, shorten tire life, increase road noise, and reduce wet-weather traction. Rotation cannot correct alignment, suspension, or inflation problems, so persistent uneven wear should be inspected.'
FROM maintenance_types mt
WHERE mt.name = 'Tire Rotation'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 3. Brake Inspection */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Brake System Inspection',
    'Learn what technicians check to help ensure the vehicle can slow down and stop predictably.',
    '## Why brake inspections matter

The braking system is a critical safety system. Pads, shoes, rotors, drums, hydraulic components, hoses, and electronic controls all need to work together.

## What the service includes

- Inspect brake pad or shoe thickness.
- Check rotors and drums for wear, scoring, cracking, or heat damage.
- Inspect calipers, wheel cylinders, hoses, and visible brake lines for leaks or damage.
- Check brake fluid level and condition.
- Listen for abnormal noises and evaluate pedal feel.
- Scan for relevant ABS or brake-system faults when appropriate.

## Warning signs

Arrange an inspection promptly if you notice grinding, persistent squealing, vibration while braking, a soft or sinking pedal, pulling to one side, or a brake warning light. If braking performance changes significantly, stop driving when safe and arrange assistance.

## Service interval

Follow the inspection schedule in the owner''s manual. Have the system checked sooner whenever symptoms appear.',
    'Worn or damaged brakes can increase stopping distance and may cause loss of braking ability. Delayed repairs can also damage rotors, drums, calipers, or other expensive components.'
FROM maintenance_types mt
WHERE mt.name = 'Brake Inspection'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 4. Coolant Flush */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Engine Coolant Service',
    'Learn how coolant protects the engine from overheating, freezing, and internal corrosion.',
    '## What coolant does

Engine coolant transfers heat away from the engine and helps protect the cooling system against freezing and corrosion. Coolant chemistry degrades over time, and the correct formulation is specific to the vehicle.

## What the service includes

- Check coolant level when the engine is completely cool.
- Inspect the radiator, reservoir, hoses, clamps, and water pump area for leaks.
- Test coolant condition when appropriate.
- Drain and refill or flush the system according to the manufacturer''s procedure.
- Use the specified coolant type and correct mixture.
- Bleed trapped air from the system when required and verify operating temperature.

## Important safety note

Never remove a radiator or pressurized coolant cap while the engine is hot. Hot coolant can cause severe burns. Do not mix coolant types unless the manufacturer specifically permits it.

## When to schedule it

Use the time and mileage interval in the owner''s manual. Some vehicles use long-life coolant and have different service requirements.',
    'Old, contaminated, incorrect, or low coolant can contribute to corrosion, restricted coolant flow, overheating, freezing damage, and expensive engine repairs. Severe overheating can damage cylinder heads, head gaskets, and other engine components.'
FROM maintenance_types mt
WHERE mt.name = 'Coolant Flush'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 5. Battery Replacement */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Battery Testing and Replacement',
    'Understand how battery testing can identify a weak starting battery before it leaves you stranded.',
    '## What the battery does

The 12-volt battery supplies power to start the vehicle and supports electrical systems when the engine is off. Charging-system problems can also cause repeated battery failures.

## What the service includes

- Test battery state of charge and starting capability.
- Inspect the case for swelling, cracks, or leakage.
- Check terminals and cables for corrosion or looseness.
- Test the charging system when symptoms suggest a problem.
- Install the correct battery group size and specification when replacement is needed.
- Perform battery registration or electronic resets if the vehicle requires them.

## Warning signs

Slow cranking, dim lights, repeated jump-starts, battery warning messages, or a battery that is several years old may indicate a problem. Temperature extremes can shorten battery life.

## Care tips

Keep terminals clean and secure. If the vehicle will sit unused for an extended period, follow the manufacturer''s storage and battery-maintenance guidance.',
    'A weak battery can cause no-start situations and unreliable electrical operation. A failing battery or charging-system fault may also create warning messages and place additional strain on the starting and charging systems.'
FROM maintenance_types mt
WHERE mt.name = 'Battery Replacement'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 6. Air Filter Replacement */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Engine Air Filter Replacement',
    'Learn how the engine air filter keeps dust and debris out of the engine while allowing proper airflow.',
    '## Why the engine air filter matters

The engine air filter cleans incoming air before it enters the engine. A clean filter helps protect internal components from abrasive dust and supports the airflow the engine management system expects.

## What the service includes

- Locate the engine air-filter housing.
- Inspect the filter for dirt, damage, moisture, or improper fit.
- Check the housing and intake duct for debris or cracks.
- Install the correct replacement filter when needed.
- Ensure the housing is fully closed and sealed.

## When to replace it

Follow the maintenance schedule in the owner''s manual. Dusty roads, construction areas, and other dirty environments can require more frequent inspection or replacement.

## Engine air filter vs. cabin air filter

The engine air filter protects the engine. The cabin air filter cleans air entering the passenger compartment. They are separate parts with separate service intervals.',
    'A severely restricted filter can reduce airflow and may affect engine performance and fuel economy. A damaged or poorly fitted filter can allow abrasive dirt into the intake system, accelerating wear.'
FROM maintenance_types mt
WHERE mt.name = 'Air Filter Replacement'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 7. Transmission Fluid Service */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Transmission Fluid Inspection and Service',
    'Understand how transmission fluid lubricates, cools, and supports proper operation of the transmission.',
    '## What transmission fluid does

Transmission fluid lubricates internal components, helps control temperature, and in many transmissions provides the hydraulic pressure needed for shifting. Fluid requirements vary significantly by transmission design.

## What the service includes

- Check for leaks around the transmission, cooler lines, and seals.
- Inspect fluid condition where the vehicle provides an approved checking procedure.
- Use only the exact fluid specification required by the manufacturer.
- Perform a drain-and-fill or other specified service procedure when due.
- Set the fluid level using the manufacturer''s temperature and operating procedure.

## Important considerations

Some transmissions do not have a conventional dipstick. Certain designs require a specific fluid temperature and vehicle-level procedure to check the level. Do not add generic transmission fluid or use a universal flush procedure without confirming manufacturer guidance.

## When to schedule it

Follow the owner''s manual for the transmission type and driving conditions. Towing, heavy loads, and severe use may change the service interval.',
    'Degraded or incorrect fluid can contribute to overheating, poor lubrication, slipping, harsh or delayed shifts, and premature transmission wear. Transmission repairs can be costly, so investigate leaks or shifting symptoms promptly.'
FROM maintenance_types mt
WHERE mt.name = 'Transmission Fluid Service'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 8. Spark Plug Replacement */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Spark Plug Inspection and Replacement',
    'Learn how spark plugs ignite the air-fuel mixture and why worn plugs can cause drivability problems.',
    '## What spark plugs do

In gasoline engines, spark plugs create the electrical spark that ignites the compressed air-fuel mixture in each cylinder. Plug design and replacement intervals vary by engine.

## What the service includes

- Identify the specified spark plug type and gap.
- Inspect plugs for wear, deposits, damage, or abnormal coloration.
- Check ignition coils and boots when symptoms indicate a problem.
- Install the correct plugs using the specified torque.
- Follow any required procedures for accessing components and reconnecting ignition parts.

## Warning signs

Possible symptoms of worn or failing spark plugs include rough idling, hesitation, hard starting, reduced performance, or an illuminated check-engine light. Misfire symptoms should be diagnosed rather than assuming spark plugs are the cause.

## When to schedule it

Use the mileage or time interval specified by the vehicle manufacturer. Some long-life plugs last substantially longer than conventional plugs.',
    'Worn or damaged spark plugs can cause misfires, rough running, reduced fuel efficiency, and increased emissions. Continued misfiring can damage the catalytic converter and may cause further engine problems.'
FROM maintenance_types mt
WHERE mt.name = 'Spark Plug Replacement'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 9. Brake Fluid Service */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Brake Fluid Service',
    'Learn why brake fluid condition matters and how moisture contamination can affect braking performance.',
    '## Why brake fluid matters

Brake fluid transfers force from the brake pedal to the braking components at the wheels. Most brake fluids absorb moisture over time, which can lower the fluid''s boiling point and contribute to internal corrosion.

## What the service includes

- Inspect the reservoir level and check for signs of leaks.
- Identify the exact brake-fluid specification required by the vehicle.
- Test fluid condition when an approved test method is available.
- Replace fluid using the manufacturer''s bleeding procedure.
- Confirm the pedal feels firm and check for leaks after service.

## Important safety notes

Brake fluid can damage paint. Keep the correct fluid container sealed and avoid contaminating the system. Never use a fluid type that does not meet the vehicle specification.

## When to schedule it

Follow the time-based interval in the owner''s manual. Some manufacturers specify replacement by time even when the vehicle has low mileage.',
    'Moisture-contaminated fluid can boil under heavy braking, potentially causing a soft pedal or reduced braking. Contamination can also contribute to corrosion and damage to hydraulic brake components.'
FROM maintenance_types mt
WHERE mt.name = 'Brake Fluid Service'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 10. Suspension and Steering Inspection */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Suspension and Steering Inspection',
    'Understand how suspension and steering components affect handling, tire wear, comfort, and vehicle control.',
    '## Why these systems matter

Suspension components help keep the tires in contact with the road, while steering components allow the driver to control the vehicle''s direction. Wear or damage can affect stability and tire wear.

## What the inspection includes

- Check shocks and struts for leaks or damage.
- Inspect ball joints, control arms, and bushings.
- Check tie-rod ends and other steering linkage.
- Look for damaged springs, mounts, and related hardware.
- Inspect for uneven tire wear and listen for clunks or rattles.
- Recommend alignment checks when symptoms or repairs indicate they are needed.

## Warning signs

Pay attention to excessive bouncing, drifting, vibration, steering looseness, clunking noises, or uneven tire wear. A vehicle that suddenly becomes difficult to steer or control should not be driven until inspected.

## When to schedule it

Follow the manufacturer''s inspection schedule and request an inspection when symptoms develop, after a significant impact, or when uneven tire wear appears.',
    'Worn or damaged components can reduce handling stability, increase stopping distances in some conditions, cause uneven tire wear, and make the vehicle harder to control. A failed steering or suspension component can create a serious safety hazard.'
FROM maintenance_types mt
WHERE mt.name = 'Suspension and Steering Inspection'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 11. Tire Pressure and Condition */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Tire Pressure and Condition',
    'Learn how correct tire pressure and regular condition checks support safety, tire life, and fuel efficiency.',
    '## Why tire pressure matters

Tires lose air naturally over time. Incorrect pressure changes the tire''s contact with the road, affects handling, and can cause excessive heat or uneven wear.

## What to check

- Measure pressure when tires are cold.
- Use the pressure listed on the driver-door placard or in the owner''s manual, not the maximum pressure printed on the tire sidewall.
- Inspect tread depth and look for cuts, bulges, cracks, or embedded objects.
- Check the spare tire if the vehicle has one.
- Make sure valve caps are installed and investigate recurring pressure loss.

## Tire-pressure monitoring systems

A TPMS warning means at least one tire may be underinflated or the system needs attention. Check all tires with a gauge; do not rely solely on the dashboard display.

## When to check

Check pressure at least monthly and before long trips, and recheck after significant temperature changes. Follow the tire and vehicle manufacturers'' guidance.',
    'Underinflated tires can overheat, wear prematurely, reduce handling response, and increase the risk of tire failure. Overinflation can reduce the contact patch and contribute to uneven wear or a harsher ride. Damaged or excessively worn tires may not provide adequate traction.'
FROM maintenance_types mt
WHERE mt.name = 'Tire Pressure and Condition'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* 12. Belts and Hoses Inspection */
INSERT INTO maintenance_guide_articles
    (maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
SELECT
    mt.id,
    'Belts and Hoses Inspection',
    'Learn how routine inspection of engine belts and hoses can help prevent breakdowns and cooling-system problems.',
    '## Why belts and hoses matter

Accessory drive belts power components such as the alternator, water pump, or air-conditioning compressor, depending on the vehicle. Hoses carry coolant and other fluids through their respective systems.

## What the inspection includes

- Check drive belts for cracks, fraying, glazing, contamination, or missing ribs.
- Inspect belt tensioners and pulleys for noise, looseness, or misalignment.
- Check coolant hoses for swelling, soft spots, cracking, hardening, or leaks.
- Inspect clamps and connections for corrosion or seepage.
- Replace components according to the manufacturer''s schedule or when deterioration is found.

## Warning signs

Squealing noises, visible belt damage, coolant smell, low coolant level, or wet areas around hose connections deserve prompt attention. Never inspect moving belts with the engine running.

## When to schedule it

Follow the owner''s manual and have belts and hoses checked during routine service, especially as the vehicle ages.',
    'A failed drive belt can disable important accessories and may cause overheating or loss of charging, depending on the engine design. A failed coolant hose can cause rapid coolant loss and overheating, potentially resulting in severe engine damage.'
FROM maintenance_types mt
WHERE mt.name = 'Belts and Hoses Inspection'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    body_markdown = VALUES(body_markdown),
    risks_if_skipped = VALUES(risks_if_skipped),
    updated_at = CURRENT_TIMESTAMP;

/* Verify that every maintenance type has a guide article. */
SELECT
    mt.id AS maintenance_type_id,
    mt.name AS maintenance_type,
    mga.id AS article_id,
    mga.title
FROM maintenance_types mt
LEFT JOIN maintenance_guide_articles mga
    ON mga.maintenance_type_id = mt.id
ORDER BY mt.id;

COMMIT;
