package com.cashcrunch.game

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.cashcrunch.game.ui.CashCrunchScreen
import com.cashcrunch.game.viewmodel.GameViewModel

/**
 * Single activity host for Cash Crunch.
 * Implements Android lifecycle event hooks to pause active simulation
 * and persist player progress upon app backgrounding.
 */
class MainActivity : ComponentActivity() {

    private val gameViewModel: GameViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize sound and haptic context
        gameViewModel.initContext(this)

        setContent {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = Color(0xFF0A0F1D)
            ) {
                CashCrunchScreen(viewModel = gameViewModel)
            }
        }
    }

    override fun onPause() {
        super.onPause()
        gameViewModel.onPauseGame()
    }

    override fun onResume() {
        super.onResume()
        gameViewModel.onResumeGame()
    }

    override fun onStop() {
        super.onStop()
        gameViewModel.saveGame()
    }
}
