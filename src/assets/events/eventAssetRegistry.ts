export interface EventAssetManifest {
  eventId: string
  folder: string
  category: 'combat' | 'environmental' | 'powerup' | 'chaos' | 'meta'
  expectedFiles: string[]
  notes: string
}

export const EVENT_ASSET_MANIFESTS: EventAssetManifest[] = [
  {
    eventId: 'hook_shot',
    folder: 'src/assets/events/hook_shot',
    category: 'combat',
    expectedFiles: ['hook_shot_chain.png', 'hook_shot_impact.png'],
    notes: 'Directional combat cue.',
  },
  {
    eventId: 'bomb_throw',
    folder: 'src/assets/events/bomb_throw',
    category: 'combat',
    expectedFiles: ['bomb_throw_bomb.png', 'bomb_throw_blast.png'],
    notes: 'Projectile plus impact.',
  },
  {
    eventId: 'position_swap',
    folder: 'src/assets/events/position_swap',
    category: 'meta',
    expectedFiles: ['position_swap_ring.png', 'position_swap_flash.png'],
    notes: 'Teleport or swap transition effect.',
  },
  {
    eventId: 'samurai_duel',
    folder: 'src/assets/events/samurai_duel',
    category: 'combat',
    expectedFiles: ['samurai_duel_slash.png', 'samurai_duel_flash.png'],
    notes: 'Close combat cue.',
  },
  {
    eventId: 'smg_attack',
    folder: 'src/assets/events/smg_attack',
    category: 'combat',
    expectedFiles: ['smg_attack_muzzle.png', 'smg_attack_tracer.png'],
    notes: 'Short burst combat effect.',
  },
  {
    eventId: 'summon_lightning_strike',
    folder: 'src/assets/events/summon_lightning_strike',
    category: 'chaos',
    expectedFiles: [
      'summon_lightning_strike_cast.png',
      'summon_lightning_strike_glow.png',
    ],
    notes: 'Pre-strike summoning effect.',
  },
  {
    eventId: 'aerial_duel',
    folder: 'src/assets/events/aerial_duel',
    category: 'combat',
    expectedFiles: ['aerial_duel_trail.png', 'aerial_duel_strike.png'],
    notes: 'Airborne clash overlay.',
  },
  {
    eventId: 'ice_patch',
    folder: 'src/assets/events/ice_patch',
    category: 'environmental',
    expectedFiles: ['ice_patch_ground.png', 'ice_patch_shards.png'],
    notes: 'Lane hazard overlay.',
  },
  {
    eventId: 'earthquake',
    folder: 'src/assets/events/earthquake',
    category: 'environmental',
    expectedFiles: ['earthquake_crack.png', 'earthquake_dust.png'],
    notes: 'Ground shake and debris.',
  },
  {
    eventId: 'tidal_wave',
    folder: 'src/assets/events/tidal_wave',
    category: 'environmental',
    expectedFiles: ['tidal_wave_front.png', 'tidal_wave_spray.png'],
    notes: 'Large horizontal sweep effect.',
  },
  {
    eventId: 'lightning_strike',
    folder: 'src/assets/events/lightning_strike',
    category: 'environmental',
    expectedFiles: ['lightning_strike_bolt.png', 'lightning_strike_flash.png'],
    notes: 'Single strike effect.',
  },
  {
    eventId: 'meteor_strike',
    folder: 'src/assets/events/meteor_strike',
    category: 'chaos',
    expectedFiles: ['meteor_strike_meteor.png', 'meteor_strike_impact.png'],
    notes: 'Large impact sequence.',
  },
  {
    eventId: 'tornado',
    folder: 'src/assets/events/tornado',
    category: 'chaos',
    expectedFiles: ['tornado_column.png', 'tornado_debris.png'],
    notes: 'Vertical vortex effect.',
  },
  {
    eventId: 'rocket_boost',
    folder: 'src/assets/events/rocket_boost',
    category: 'powerup',
    expectedFiles: ['rocket_boost_flame.png', 'rocket_boost_trail.png'],
    notes: 'Speed boost visuals.',
  },
  {
    eventId: 'temporary_shield',
    folder: 'src/assets/events/temporary_shield',
    category: 'powerup',
    expectedFiles: ['temporary_shield_ring.png', 'temporary_shield_hit.png'],
    notes: 'Protective aura assets.',
  },
  {
    eventId: 'magnet_pull',
    folder: 'src/assets/events/magnet_pull',
    category: 'powerup',
    expectedFiles: ['magnet_pull_field.png', 'magnet_pull_arc.png'],
    notes: 'Attraction field visuals.',
  },
  {
    eventId: 'ufo_abduction',
    folder: 'src/assets/events/ufo_abduction',
    category: 'chaos',
    expectedFiles: [
      'ufo_abduction_saucer.png',
      'ufo_abduction_beam.png',
      'ufo_abduction_glow.png',
    ],
    notes: 'Saucer, beam, and ground glow layers.',
  },
  {
    eventId: 'chain_reaction',
    folder: 'src/assets/events/chain_reaction',
    category: 'meta',
    expectedFiles: ['chain_reaction_link.png', 'chain_reaction_flash.png'],
    notes: 'Connected event cascade cue.',
  },
  {
    eventId: 'chain_stun',
    folder: 'src/assets/events/chain_stun',
    category: 'meta',
    expectedFiles: ['chain_stun_arc.png', 'chain_stun_ring.png'],
    notes: 'Connected stun state effect.',
  },
  {
    eventId: 'luck_charm',
    folder: 'src/assets/events/luck_charm',
    category: 'powerup',
    expectedFiles: ['luck_charm_star.png', 'luck_charm_glint.png'],
    notes: 'Positive buff indicator.',
  },
]
