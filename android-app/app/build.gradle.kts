plugins {
    id("com.android.application")
}

android {
    namespace = "id.vylonium.mydaily"
    compileSdk = 34

    defaultConfig {
        applicationId = "id.vylonium.mydaily"
        minSdk = 23
        targetSdk = 34
        versionCode = 2
        versionName = "2.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
