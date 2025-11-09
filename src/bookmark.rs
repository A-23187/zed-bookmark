use std::{env, fs, io};
use zed_extension_api::{self as zed};

const PACKAGE_NAME: &'static str = "zed-bookmark-language-server";
const SERVER_PATH: &'static str = "node_modules/zed-bookmark-language-server/src/server.js";

fn server_path() -> Result<String, io::Error> {
    let ext_work_dir = env::current_dir()?;
    Ok(ext_work_dir.join(SERVER_PATH).to_string_lossy().to_string())
}

struct BookmarkExtension;

impl BookmarkExtension {
    fn install(&self, language_server_id: &zed::LanguageServerId) -> zed::Result<()> {
        match zed::npm_package_installed_version(PACKAGE_NAME)? {
            Some(installed_version) => {
                zed::set_language_server_installation_status(
                    language_server_id,
                    &zed::LanguageServerInstallationStatus::CheckingForUpdate,
                );
                let latest_version = zed::npm_package_latest_version(PACKAGE_NAME)?;
                if installed_version == latest_version {
                    return Ok(());
                }
            }
            None => {}
        }
        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::Downloading,
        );
        zed::npm_install_package(
            PACKAGE_NAME,
            &zed::npm_package_latest_version(PACKAGE_NAME)?,
        )?;
        let installed = fs::metadata(server_path().map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?
            .is_file();
        if !installed {
            Err("install {PACKAGE_NAME} failed".to_string())
        } else {
            Ok(())
        }
    }
}

impl zed::Extension for BookmarkExtension {
    fn new() -> Self {
        Self {}
    }

    fn language_server_command(
        &mut self,
        language_server_id: &zed::LanguageServerId,
        _worktree: &zed::Worktree,
    ) -> zed::Result<zed::Command> {
        self.install(language_server_id)?;
        Ok(zed::Command {
            command: zed::node_binary_path()?,
            args: vec![
                server_path().map_err(|e| e.to_string())?,
                "--stdio".to_string(),
            ],
            env: Default::default(),
        })
    }
}

zed::register_extension!(BookmarkExtension);
