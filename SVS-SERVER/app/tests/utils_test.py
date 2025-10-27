def test_get_real_path_single():
    from app.config.globals import BASE_DIR
    from app.utils import get_real_path
    import os

    # Test single argument
    assert get_real_path("file.txt") == os.path.join(BASE_DIR, "file.txt")


def test_get_real_path_multiple():
    from app.config.globals import BASE_DIR
    from app.utils import get_real_path
    import os

    # Test multiple arguments
    assert get_real_path("dir1", "dir2", "file.txt") == os.path.join(
        BASE_DIR, "dir1", "dir2", "file.txt"
    )


def test_get_real_path_no_args():
    from app.config.globals import BASE_DIR
    from app.utils import get_real_path

    # Test no arguments
    assert get_real_path() == BASE_DIR
