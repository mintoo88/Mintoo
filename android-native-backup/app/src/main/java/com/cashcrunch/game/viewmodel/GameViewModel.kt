package com.cashcrunch.game.viewmodel

import android.content.Context
import android.content.SharedPreferences
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cashcrunch.game.model.*
import com.google.gson.Gson
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.math.*

class GameViewModel : ViewModel() {

    private val _gameState = MutableStateFlow(GameState())
    val gameState: StateFlow<GameState> = _gameState.asStateFlow()

    private val _notes = MutableStateFlow<List<Banknote>>(emptyList())
    val notes: StateFlow<List<Banknote>> = _notes.asStateFlow()

    private val _particles = MutableStateFlow<List<Particle>>(emptyList())
    val particles: StateFlow<List<Particle>> = _particles.asStateFlow()

    private val _floatingRewards = MutableStateFlow<List<FloatingReward>>(emptyList())
    val floatingRewards: StateFlow<List<FloatingReward>> = _floatingRewards.asStateFlow()

    private val _comboMultiplier = MutableStateFlow(1.0f)
    val comboMultiplier: StateFlow<Float> = _comboMultiplier.asStateFlow()

    private val _isShredderActive = MutableStateFlow(false)
    val isShredderActive: StateFlow<Boolean> = _isShredderActive.asStateFlow()

    var shredderX = 0f
    var shredderY = 0f
    var shredderRadius = 36f

    private var sharedPrefs: SharedPreferences? = null
    private var vibrator: Vibrator? = null
    private var isPaused = false

    fun initContext(context: Context) {
        sharedPrefs = context.getSharedPreferences("cash_crunch_prefs", Context.MODE_PRIVATE)
        vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        loadSavedGame()
        startGameLoop()
    }

    private fun startGameLoop() {
        viewModelScope.launch {
            var lastTime = System.currentTimeMillis()
            while (true) {
                val now = System.currentTimeMillis()
                val dt = min(0.1f, (now - lastTime) / 1000f)
                lastTime = now

                if (!isPaused) {
                    updateSimulation(dt)
                }
                delay(16) // ~60 FPS
            }
        }
    }

    private fun updateSimulation(dt: Float) {
        // Physics update on banknotes
        val currentNotes = _notes.value.toMutableList()
        val currentParticles = _particles.value.toMutableList()
        val currentRewards = _floatingRewards.value.toMutableList()

        for (note in currentNotes) {
            if (note.isDestroyed) continue
            note.x += note.vx * dt
            note.y += note.vy * dt
            note.angle += note.vAngle * dt
            note.vx *= 0.95f
            note.vy *= 0.95f
            note.vAngle *= 0.95f

            // Check shredder collision
            if (_isShredderActive.value) {
                val dist = hypot(note.x - shredderX, note.y - shredderY)
                if (dist < shredderRadius + 25f) {
                    note.isShredding = true
                    val dps = 100f + (_gameState.value.upgradeLevels["sharp_blades"] ?: 1) * 35f
                    note.health -= dps * dt

                    if (note.health <= 0f && !note.isDestroyed) {
                        note.isDestroyed = true
                        val earned = (note.baseValue * _comboMultiplier.value).toLong()
                        _gameState.value = _gameState.value.copy(
                            credits = _gameState.value.credits + earned,
                            lifetimeCredits = _gameState.value.lifetimeCredits + earned
                        )
                        triggerHaptic(20)
                        currentRewards.add(
                            FloatingReward(
                                id = "${System.currentTimeMillis()}_${note.id}",
                                x = note.x,
                                y = note.y - 10f,
                                text = "+$$earned",
                                color = 0xFF4ADE80
                            )
                        )
                    }
                }
            }
        }

        // Particle updates
        val particleIterator = currentParticles.iterator()
        while (particleIterator.hasNext()) {
            val p = particleIterator.next()
            p.life -= dt
            if (p.life <= 0f) {
                particleIterator.remove()
            } else {
                p.x += p.vx * dt
                p.y += p.vy * dt
            }
        }

        // Floating rewards update
        val rewardIterator = currentRewards.iterator()
        while (rewardIterator.hasNext()) {
            val r = rewardIterator.next()
            r.life -= dt
            r.y -= 30f * dt
            if (r.life <= 0f) {
                rewardIterator.remove()
            }
        }

        _notes.value = currentNotes.filter { !it.isDestroyed }
        _particles.value = currentParticles
        _floatingRewards.value = currentRewards
    }

    fun onTouchShredder(x: Float, y: Float, active: Boolean) {
        shredderX = x
        shredderY = y
        _isShredderActive.value = active
    }

    fun dispenseNote(screenWidth: Float) {
        val currentNotes = _notes.value.toMutableList()
        val cap = 12 + (_gameState.value.upgradeLevels["hopper_capacity"] ?: 1) * 3
        if (currentNotes.size >= cap) return

        val note = Banknote(
            id = "note_${System.currentTimeMillis()}",
            type = NoteType.STANDARD,
            x = screenWidth / 2f + (Math.random().toFloat() - 0.5f) * 160f,
            y = 50f,
            vx = (Math.random().toFloat() - 0.5f) * 40f,
            vy = 100f + Math.random().toFloat() * 40f,
            angle = (Math.random().toFloat() - 0.5f) * 0.4f,
            vAngle = (Math.random().toFloat() - 0.5f) * 1.0f,
            health = 100f,
            maxHealth = 100f,
            baseValue = 10L
        )
        currentNotes.add(note)
        _notes.value = currentNotes
        triggerHaptic(10)
    }

    private fun triggerHaptic(durationMs: Long) {
        if (!_gameState.value.vibrationEnabled) return
        try {
            vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
        } catch (_: Exception) {}
    }

    fun onPauseGame() {
        isPaused = true
    }

    fun onResumeGame() {
        isPaused = false
    }

    fun saveGame() {
        val json = Gson().toJson(_gameState.value)
        sharedPrefs?.edit()?.putString("save_data", json)?.apply()
    }

    private fun loadSavedGame() {
        val raw = sharedPrefs?.getString("save_data", null) ?: return
        try {
            val state = Gson().fromJson(raw, GameState::class.java)
            if (state != null) {
                _gameState.value = state
            }
        } catch (_: Exception) {}
    }
}
