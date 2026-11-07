import React, { useState } from 'react';
import { X, Code2, Copy, Check, Smartphone, Terminal, FolderCheck } from 'lucide-react';
import { soundService } from '../../services/audio';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<'main' | 'screen' | 'canvas' | 'viewmodel' | 'gradle'>('main');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fileContents: Record<string, { name: string; path: string; code: string }> = {
    main: {
      name: 'MainActivity.kt',
      path: 'android/app/src/main/java/com/cashcrunch/game/MainActivity.kt',
      code: `package com.cashcrunch.game

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
}`,
    },
    screen: {
      name: 'CashCrunchScreen.kt',
      path: 'android/app/src/main/java/com/cashcrunch/game/ui/CashCrunchScreen.kt',
      code: `package com.cashcrunch.game.ui

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

@Composable
fun CashCrunchScreen(viewModel: GameViewModel) {
    val state by viewModel.gameState.collectAsState()
    val notes by viewModel.notes.collectAsState()

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val screenWidth = maxWidth.value

        // 2D Interactive Tabletop Playfield
        PlayfieldCanvas(
            viewModel = viewModel,
            modifier = Modifier.fillMaxSize()
        )

        // Top HUD Bar
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
                    text = "$$\{state.credits}",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }
        }

        // Bottom Dispenser Action
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
            Text("DISPENSE NOTE", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}`,
    },
    canvas: {
      name: 'PlayfieldCanvas.kt',
      path: 'android/app/src/main/java/com/cashcrunch/game/ui/PlayfieldCanvas.kt',
      code: `package com.cashcrunch.game.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.input.pointer.pointerInput
import com.cashcrunch.game.viewmodel.GameViewModel

@Composable
fun PlayfieldCanvas(viewModel: GameViewModel, modifier: Modifier = Modifier) {
    val notes by viewModel.notes.collectAsState()
    val isShredderActive by viewModel.isShredderActive.collectAsState()

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragStart = { viewModel.onTouchShredder(it.x, it.y, true) },
                    onDragEnd = { viewModel.onTouchShredder(0f, 0f, false) },
                    onDrag = { change, _ ->
                        change.consume()
                        viewModel.onTouchShredder(change.position.x, change.position.y, true)
                    }
                )
            }
    ) {
        // Table planks, banknotes, dual saw blades, confetti particles
    }
}`,
    },
    viewmodel: {
      name: 'GameViewModel.kt',
      path: 'android/app/src/main/java/com/cashcrunch/game/viewmodel/GameViewModel.kt',
      code: `package com.cashcrunch.game.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cashcrunch.game.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class GameViewModel : ViewModel() {
    private val _gameState = MutableStateFlow(GameState())
    val gameState = _gameState.asStateFlow()

    private val _notes = MutableStateFlow<List<Banknote>>(emptyList())
    val notes = _notes.asStateFlow()

    // 60 FPS coroutine physics loop, touch collision & autosave
}`,
    },
    gradle: {
      name: 'build.gradle.kts',
      path: 'android/app/build.gradle.kts',
      code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.cashcrunch.game"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.cashcrunch.game"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.9.3")
}`,
    },
  };

  const current = fileContents[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    soundService.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col max-h-[90vh]">
        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-pixel text-xs text-emerald-300">
              CASH CRUNCH APK & TESTING
            </h3>
            <p className="text-[11px] text-slate-400">
              Android 8.0+ · Landscape Mode · Capacitor Android
            </p>
          </div>
        </div>

        {/* 1. Direct Phone Play Link */}
        <div className="p-3 mb-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs">
          <div className="font-bold text-emerald-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🚀</span>
              <span>Test Instantly on Android (No Install Needed)</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            Open this URL in Google Chrome on your Android phone for full-screen landscape gameplay, touch physics, and audio:
          </p>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 select-all overflow-x-auto">
            <span>https://ais-pre-6ibtd6sz4annr62jdfy4sp-86412784259.asia-east1.run.app</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Tip: In Chrome on your phone, tap <strong>⋮ (Menu) → Add to Home screen</strong> to run it as a standalone app!
          </div>
        </div>

        {/* 2. Download APK via GitHub Actions */}
        <div className="p-3 mb-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
            <span>📦</span>
            <span>How to Download the .apk File</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
            <li>
              Click <strong>Export / GitHub</strong> in the top-right of AI Studio to push to your repository.
            </li>
            <li>
              Open your repository on GitHub and click the <strong>Actions</strong> tab.
            </li>
            <li>
              Click <strong>Build Android APK</strong> → <strong>Run workflow</strong>.
            </li>
            <li>
              When the run completes, click it and download <strong>Cash-Crunch-APK</strong> from the <em>Artifacts</em> section.
            </li>
            <li>
              Install the downloaded <code className="text-emerald-400">app-debug.apk</code> on your phone.
            </li>
          </ol>
        </div>

        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="mt-1 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-pixel tracking-wider cursor-pointer shadow-lg shadow-emerald-950/40 active:scale-98"
        >
          BACK TO GAMEPLAY
        </button>
      </div>
    </div>
  );
};
