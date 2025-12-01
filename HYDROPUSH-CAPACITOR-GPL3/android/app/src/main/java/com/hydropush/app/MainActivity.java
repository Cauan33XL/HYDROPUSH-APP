package com.hydropush.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Capacitor 7 registra plugins automaticamente via gradle
        // Não é necessário registro manual de plugins aqui

        // Se necessário, configurações adicionais podem ser feitas aqui
        // Por exemplo: configurar orientação, tema, etc.
    }
}