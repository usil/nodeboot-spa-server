const argvs = require('../src/lib/argvs.js');

describe('Correct Args Workflow', () => {
  it('help exits', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const mockHelpArg = { help: true };
    const mockHArg = { h: true };
    const mockArg = { };
    argvs().helpBehaviour(mockHelpArg);
    argvs().helpBehaviour(mockHArg);
    argvs().helpBehaviour(mockArg);
    expect(mockExit).toHaveBeenCalledTimes(2);
    mockExit.mockRestore();
  })

  it('sets the name of the static path', () => {
    const mockDArg = { d: 'ThePathShort' };
    const pathShort = argvs().getStaticDirName(mockDArg);
    expect(pathShort).toBe('ThePathShort');

    const mockDirArg = { dir: 'ThePath' };
    const path = argvs().getStaticDirName(mockDirArg);
    expect(path).toBe('ThePath');

    const mockArg = { _: ['ThePath'] };
    const pathDefault = argvs().getStaticDirName(mockArg);
    expect(pathDefault).toBe('ThePath');

    const mockNoArg = { _: [] };
    expect(() => argvs().getStaticDirName(mockNoArg)).toThrow('Static Files Path Was not Send');
  })

  it('sets the port', () => {
    const mockPArg = { p: 199 };
    const portShort = argvs().getPort(mockPArg);
    expect(portShort).toBe(199);

    const mockPortArg = { port: 200 };
    const port = argvs().getPort(mockPortArg);
    expect(port).toBe(200);

    const mockPort = { };
    const portDefault = argvs().getPort(mockPort);
    expect(portDefault).toBe(8080);
  })

  it('sets the settings', () => {
    const mockSArg = { s: 'aSPath' };
    const settingsPathShort = argvs().setSettingsPath(mockSArg);
    expect(settingsPathShort).toBe('aSPath');

    const mockSettingsArg = { settings: 'aSettingsPath' };
    const settingsPath = argvs().setSettingsPath(mockSettingsArg);
    expect(settingsPath).toBe('aSettingsPath');

    const mockDefault = { };
    const settingsDefault = argvs().setSettingsPath(mockDefault);
    expect(settingsDefault).toBe(undefined);
  })
})