package expo.modules.kakehashiwidget

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

/** Credential-free preference shared by widgets and the application's notification receiver. */
object InterfaceLocale {
  private const val PREFERENCES = "kakehashi_interface_language"
  fun language(context: Context): String =
    if (context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
      .getString("language", "en") == "tr") "tr" else "en"
  fun set(context: Context, language: String) {
    context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE).edit()
      .putString("language", if (language == "tr") "tr" else "en").commit()
  }
  fun context(context: Context): Context {
    val configuration = Configuration(context.resources.configuration)
    configuration.setLocale(Locale.forLanguageTag(language(context)))
    return context.createConfigurationContext(configuration)
  }
}
