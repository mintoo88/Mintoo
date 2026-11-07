package com.cashcrunch.game.model

enum class NoteType {
    STANDARD,
    REINFORCED,
    SPARK,
    BURST,
    GOLDEN
}

data class Banknote(
    val id: String,
    val type: NoteType,
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    var angle: Float,
    var vAngle: Float,
    val width: Float = 66f,
    val height: Float = 34f,
    var health: Float,
    val maxHealth: Float,
    val baseValue: Long,
    var isDestroyed: Boolean = false,
    var isShredding: Boolean = false
)

data class Particle(
    val id: Long,
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    val color: Long,
    val size: Float,
    var life: Float,
    val maxLife: Float,
    var rotation: Float,
    val vRot: Float,
    val isStrip: Boolean = false
)

data class FloatingReward(
    val id: String,
    var x: Float,
    var y: Float,
    val text: String,
    val color: Long,
    var life: Float,
    val maxLife: Float = 0.8f
)

data class UpgradeItem(
    val id: String,
    val name: String,
    val description: String,
    val category: String,
    val level: Int,
    val maxLevel: Int,
    val baseCost: Long,
    val costMultiplier: Double
) {
    val currentCost: Long
        get() = if (level >= maxLevel) Long.MAX_VALUE else (baseCost * Math.pow(costMultiplier, level.toDouble())).toLong()
}

data class GameState(
    var credits: Long = 0L,
    var lifetimeCredits: Long = 0L,
    var gearTokens: Long = 0L,
    var upgradeLevels: MutableMap<String, Int> = mutableMapOf(),
    var prestigeLevels: MutableMap<String, Int> = mutableMapOf(),
    var soundEnabled: Boolean = true,
    var vibrationEnabled: Boolean = true,
    var reducedEffects: Boolean = false,
    var lastSavedTimestamp: Long = System.currentTimeMillis()
)
