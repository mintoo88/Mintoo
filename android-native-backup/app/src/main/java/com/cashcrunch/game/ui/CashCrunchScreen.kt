package com.cashcrunch.game.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cashcrunch.game.viewmodel.GameViewModel

/**
 * Main game screen composable orchestrating HUD, 2D playfield,
 * bottom dispenser trigger, and upgrade drawer.
 */
@Composable
fun CashCrunchScreen(viewModel: GameViewModel) {
    val state by viewModel.gameState.collectAsState()
    val notes by viewModel.notes.collectAsState()

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val screenWidth = maxWidth.value

        // 1. 2D Interactive Playfield
        PlayfieldCanvas(
            viewModel = viewModel,
            modifier = Modifier.fillMaxSize()
        )

        // 2. Top HUD Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 40.dp, start = 16.dp, end = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "CASH CRUNCH",
                    color = Color(0xFFF59E0B),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "$${state.credits}",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }

            Surface(
                color = Color(0x991E293B),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "Table: ${notes.size}",
                    color = Color(0xFF94A3B8),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                )
            }
        }

        // 3. Bottom Dispenser Button
        Button(
            onClick = { viewModel.dispenseNote(screenWidth) },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp)
                .height(56.dp)
                .fillMaxWidth(0.85f),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text(
                text = "DISPENSE NOTE",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}
