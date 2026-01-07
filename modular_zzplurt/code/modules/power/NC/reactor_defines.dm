// General reactor defines
/// Dimensions for the input grid of a reactor.
#define REACTOR_GRID_WIDTH 6
/// Dimensions for the input grid of a reactor.
#define REACTOR_GRID_HEIGHT 6

#define REACTOR_OFFLINE 0
#define REACTOR_ONLINE 1


// Tunables / defaults
#define ROD_INTEGRITY_BASE        100
#define ROD_INTEGRITY_MIN_DECAY  0.05
#define ROD_DECAY_MULT           0.01
#define SHIELD_DEFAULT_CAPACITY  400
#define SHIELD_INTEGRITY_BASE    200
#define SHIELD_OVERHEAT_DAMAGE  0.01
#define VENT_DEFAULT_CAPACITY    120
#define VENT_INTEGRITY_BASE      120
#define VENT_DEFAULT_COOL        5
#define VENT_OVERHEAT_DAMAGE     0.02
#define SHIELD_TO_VENT_TRANSFER_RATIO 0.7

// Reactor temperatures (Reactor pressure vessel)

/// This is the operating temperature of the reactor, if we cannot boil the water to create steam, how can we run?
#define REACTOR_TEMPERATURE_MINIMUM 373.2 // Kelvin
/// The highest possible temperature the reactor can reach without taking damage from overheating.
#define REACTOR_TEMPERATURE_MAXIMUM 10000 // random units
/// The fastest rate the reactor can change temperature.
#define REACTOR_MAX_TEMPERATURE_CHANGE 20
/// The fastest the ambient temperature can convect our internal temperature.
#define REACTOR_MAX_TEMPERATURE_CONDUCTION 5

// Reactor pressures (Reactor pressure vessel)
/// This is the pressure at which the reactor is best operating.
#define REACTOR_PRESSURE_OPERATING 7000 // Kilopascal
/// This is the maximum pressure the reactor can operate at without taking damage.
#define REACTOR_PRESSURE_MAXIMUM 9000


// Damage defines
/// How much damage can the reactor take in any given second, limited to 5 so people have around 20 seconds to GTFO if the reactor is really dying.
#define REACTOR_MAX_DAMAGE_PER_SECOND 5
