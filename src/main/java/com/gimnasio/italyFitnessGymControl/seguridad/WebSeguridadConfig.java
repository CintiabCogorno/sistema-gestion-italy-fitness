package com.gimnasio.italyFitnessGymControl.seguridad;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Conecta el control de permisos con todas las rutas de la aplicación. */
@Configuration
public class WebSeguridadConfig implements WebMvcConfigurer {

    private final AutorizacionInterceptor autorizacion;

    public WebSeguridadConfig(AutorizacionInterceptor autorizacion) {
        this.autorizacion = autorizacion;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(autorizacion).addPathPatterns("/**");
    }
}
