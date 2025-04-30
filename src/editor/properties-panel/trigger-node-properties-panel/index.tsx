								onClick={() => {
									// インストールページへのリダイレクト
									if (github?.installationUrl) {
										const width = 800;
										const height = 800;
										const left = window.screenX + (window.outerWidth - width) / 2;
										const top = window.screenY + (window.outerHeight - height) / 2;
										
										window.open(
											github.installationUrl,
											"Configure GitHub App",
											`width=${width},height=${height},top=${top},left=${left},popup=1`
										);
									}
								}}
							>
								Save
							</button> 