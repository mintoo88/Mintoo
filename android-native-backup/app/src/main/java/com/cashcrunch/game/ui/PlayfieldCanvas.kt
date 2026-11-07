package com.cashcrunch.game.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.input.pointer.pointerInput
import com.cashcrunch.game.viewmodel.GameViewModel

/**
 * 2D Canvas rendering the workshop wooden tabletop, banknotes,
 * shredder tool with dual rotating teeth, particles, and floating numbers.
 */
@Composable
fun PlayfieldCanvas(
    viewModel: GameViewModel,
    modifier: Modifier = Modifier
) {
    val notes by viewModel.notes.collectAsState()
    val isShredderActive by viewModel.isShredderActive.collectAsState()
    val floatingRewards by viewModel.floatingRewards.collectAsState()

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragStart = { offset ->
                        viewModel.onTouchShredder(offset.x, offset.y, true)
                    },
                    onDragEnd = {
                        viewModel.onTouchShredder(0f, 0f, false)
                    },
                    onDragCancel = {
                        viewModel.onTouchShredder(0f, 0f, false)
                    },
                    onDrag = { change, _ ->
                        change.consume()
                        viewModel.onTouchShredder(change.position.x, change.position.y, true)
                    }
                )
            }
    ) {
        val width = size.width
        val height = size.height

        // 1. Draw Wooden Tabletop Planks
        val plankHeight = 70f
        var currentY = 0f
        var isAlt = false
        while (currentY < height) {
            val plankColor = if (isAlt) Color(0xFF2D1A10) else Color(0xFF25150D)
            drawRect(
                color = plankColor,
                topLeft = Offset(0f, currentY),
                size = Size(width, plankHeight)
            )
            // Seam
            drawRect(
                color = Color(0x66000000),
                topLeft = Offset(0f, currentY + plankHeight - 2f),
                size = Size(width, 2f)
            )
            currentY += plankHeight
            isAlt = !isAlt
        }

        // 2. Draw Banknotes
        for (note in notes) {
            rotate(degrees = Math.toDegrees(note.angle.toDouble()).toFloat(), pivot = Offset(note.x, note.y)) {
                // Banknote Shadow
                drawRoundRect(
                    color = Color(0x55000000),
                    topLeft = Offset(note.x - note.width / 2 + 3f, note.y - note.height / 2 + 4f),
                    size = Size(note.width, note.height),
                    cornerRadius = CornerRadius(4f, 4f)
                )

                // Banknote Body
                drawRoundRect(
                    color = Color(0xFF15803D),
                    topLeft = Offset(note.x - note.width / 2, note.y - note.height / 2),
                    size = Size(note.width, note.height),
                    cornerRadius = CornerRadius(4f, 4f)
                )

                // Central Seal
                drawCircle(
                    color = Color(0xFF86EFAC),
                    radius = 8f,
                    center = Offset(note.x, note.y)
                )
            }
        }

        // 3. Draw Shredder Tool
        if (isShredderActive) {
            val sx = viewModel.shredderX
            val sy = viewModel.shredderY
            val radius = viewModel.shredderRadius

            // Shredder aura
            drawCircle(
                color = Color(0x33F59E0B),
                radius = radius,
                center = Offset(sx, sy)
            )
            // Dual cutting teeth circles
            drawCircle(
                color = Color(0xFF94A3B8),
                radius = radius * 0.55f,
                center = Offset(sx - radius * 0.35f, sy)
            )
            drawCircle(
                color = Color(0xFFCBD5E1),
                radius = radius * 0.55f,
                center = Offset(sx + radius * 0.35f, sy)
            )
            // Center rivet
            drawCircle(
                color = Color(0xFFF59E0B),
                radius = 6f,
                center = Offset(sx, sy)
            )
        }

        // 4. Draw Floating Rewards
        for (reward in floatingRewards) {
            drawCircle(
                color = Color(reward.color),
                radius = 3f,
                center = Offset(reward.x, reward.y)
            )
        }
    }
}
